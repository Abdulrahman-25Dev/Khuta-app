'use strict';
// expo config plugin: dynamic app icons (react-native-change-icon) for Android.
//
// في وقت البناء (prebuild / EAS):
//  1) يُسجّل activity-alias لكل أيقونة داخل AndroidManifest.xml بالصيغة التي
//     يتوقعها module التغيير الجاف الحي:
//         <activity-alias android:name=".MainActivity<alias>" ...>
//     حيث <alias> هو الاسم نفسه الذي يُمرَّر إلى changeIcon('<alias>').
//  2) يزيل الـ LAUNCHER intent-filter من MainActivity الأساسية ويضيفه إلى
//     ".MainActivityDefault" (المفعّلة افتراضياً) + لكل أيقونة بديلة.
//  3) ينسخ صورة كل أيقونة إلى res/mipmap-*/ كـ ic_launcher_<alias>.png؛ وإن
//     كان الملف مفقوداً يولّد صورة ملونة نائبة بدل فشل البناء.
const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('@expo/config-plugins');
const { createPlaceholderIconPng } = require('./lib/pngGenerator');

const DEFAULT_ALIAS = 'Default';
const MAIN_ACTIVITY = '.MainActivity';
const MIPMAP_DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const PLACEHOLDER_SIZE = 192;

function isLauncherIntentFilter(intentFilter) {
  const actions = (intentFilter.action || []).map((a) => (a.$ ? a.$['android:name'] : null));
  const categories = (intentFilter.category || []).map((c) => (c.$ ? c.$['android:name'] : null));
  return (
    actions.includes('android.intent.action.MAIN') &&
    categories.includes('android.intent.category.LAUNCHER')
  );
}

function buildLauncherIntentFilter() {
  return {
    action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
    category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
  };
}

function sanitizeAliasName(name) {
  return String(name || '')
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, '_');
}

// 1) تعديل AndroidManifest.xml
function withIconAliases(config, icons) {
  return withAndroidManifest(config, (manifestConfig) => {
    const androidManifest = manifestConfig.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);

    // إزالة LAUNCHER من الـ MainActivity الأساسية (تنتقل إلى الـ aliases)
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
    if (Array.isArray(mainActivity['intent-filter'])) {
      mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
        (filter) => !isLauncherIntentFilter(filter)
      );
    } else {
      delete mainActivity['intent-filter'];
    }

    // تجهيز مصفوفة aliases (حذف أي alias قديم من تشغيل سابق لتفادي التكرار)
    const existingAliases = Array.isArray(application['activity-alias'])
      ? application['activity-alias']
      : [];
    const knownNames = new Set(['.MainActivity' + DEFAULT_ALIAS]);
    icons.forEach((icon) => knownNames.add('.MainActivity' + sanitizeAliasName(icon.name)));
    const keptAliases = existingAliases.filter((alias) => {
      const name = alias.$ && alias.$['android:name'];
      if (name === MAIN_ACTIVITY) return true;
      return !name || !knownNames.has(name);
    });

    // alias الافتراضي: مفعّل افتراضياً ويشير لأيقونة التطبيق الافتراضية
    const defaultAlias = {
      $: {
        'android:name': '.MainActivity' + DEFAULT_ALIAS,
        'android:enabled': 'true',
        'android:exported': 'true',
        'android:icon': '@mipmap/ic_launcher',
        'android:targetActivity': MAIN_ACTIVITY,
      },
      'intent-filter': [buildLauncherIntentFilter()],
    };

    // alias لكل أيقونة بديلة: معطّل افتراضياً ويُفعَّل من الـ module لحظة التبديل
    const alternateAliases = icons.map((icon) => ({
      $: {
        'android:name': '.MainActivity' + sanitizeAliasName(icon.name),
        'android:enabled': 'false',
        'android:exported': 'true',
        'android:icon': '@mipmap/ic_launcher_' + sanitizeAliasName(icon.name),
        'android:targetActivity': MAIN_ACTIVITY,
      },
      'intent-filter': [buildLauncherIntentFilter()],
    }));

    application['activity-alias'] = [...keptAliases, defaultAlias, ...alternateAliases];
    return manifestConfig;
  });
}

// 2) نسخ/توليد صور الأيقونات داخل res/mipmap-*/
function withIconResources(config, icons) {
  return withDangerousMod(config, [
    'android',
    async (dangerousConfig) => {
      const projectRoot = dangerousConfig.modRequest.projectRoot;
      const androidResRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

      for (const icon of icons) {
        const alias = sanitizeAliasName(icon.name);
        let pngBuffer = null;
        let sourcePath = null;

        if (icon.source) {
          sourcePath = path.isAbsolute(icon.source)
            ? icon.source
            : path.join(projectRoot, icon.source);
          if (fs.existsSync(sourcePath)) {
            pngBuffer = fs.readFileSync(sourcePath);
          }
        } else {
          // بحث تلقائي عن ملف يحمل اسم الـ alias داخل assets/icons
          for (const ext of ['.png', '.jpg']) {
            const candidate = path.join(projectRoot, 'assets', 'icons', alias + ext);
            if (fs.existsSync(candidate)) {
              sourcePath = candidate;
              pngBuffer = fs.readFileSync(candidate);
              break;
            }
          }
        }

        if (!pngBuffer) {
          if (icon.source) {
            // الملف المحدد غير موجود: نُنبه ونولّد نائباً بدل إفشال البناء
            console.warn(
              `[withDynamicAppIcons] missing icon file '${icon.source}', using generated placeholder for '${alias}'`
            );
          }
          pngBuffer = createPlaceholderIconPng(
            PLACEHOLDER_SIZE,
            icon.color || '#334155',
            icon.secondaryColor || icon.color || '#94A3B8'
          );
        }

        for (const density of MIPMAP_DENSITIES) {
          const dir = path.join(androidResRoot, 'mipmap-' + density);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `ic_launcher_${alias}.png`), pngBuffer);
        }
      }
      return dangerousConfig;
    },
  ]);
}

module.exports = function withDynamicAppIcons(config, options = {}) {
  const rawIcons = Array.isArray(options.icons) ? options.icons : [];
  // أيقونات معقّدة الاسم: نمررها كما هي حتى يطابق الاسم call في changeIcon()
  const icons = rawIcons
    .map((icon) => ({
      name: sanitizeAliasName(icon.name),
      color: icon.color,
      secondaryColor: icon.secondaryColor,
      source: icon.source,
    }))
    .filter((icon) => icon.name && icon.name.length > 0);

  const configWithAliases = withIconAliases(config, icons);
  const configWithResources = withIconResources(configWithAliases, icons);
  return configWithResources;
};