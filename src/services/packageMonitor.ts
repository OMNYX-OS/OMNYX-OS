/**
 * Package Monitor Service
 *
 * Wraps the OmnyxPackageMonitor native module (modules/package-monitor).
 * Listens for app install and update events, analyzes the new app's
 * permission profile, and surfaces findings as ThreatEvents.
 *
 * Security notes:
 * - Only available on Android; no-ops on other platforms.
 * - Native module must be registered via expo prebuild before use.
 * - No PII collected. Only package name, app name, and declared permissions.
 * - Analysis is local; no network calls triggered from this module.
 */

import { NativeEventEmitter, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import { calculateRiskProfile } from './riskEngine';
import { buildInstallThreatEvent } from './privacyIntelligence';
import type { ThreatEvent } from '@/types';

const NativeMonitor: {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
} | null = Platform.OS === 'android'
  ? (() => {
      try {
        return requireNativeModule('OmnyxPackageMonitor');
      } catch {
        return null;
      }
    })()
  : null;

type InstallCallback = (threatEvent: ThreatEvent) => void;

let subscription: ReturnType<NativeEventEmitter['addListener']> | null = null;

interface InstallEvent {
  packageName: string;
  appName: string;
  permissions: string[];
  isUpdate: boolean;
  isSystemApp: boolean;
  installTime: number;
}

const RAW_PERMISSION_MAP: Record<string, string> = {
  'android.permission.ACCESS_FINE_LOCATION': 'ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION': 'ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION': 'ACCESS_BACKGROUND_LOCATION',
  'android.permission.RECORD_AUDIO': 'RECORD_AUDIO',
  'android.permission.CAMERA': 'CAMERA',
  'android.permission.READ_CONTACTS': 'READ_CONTACTS',
  'android.permission.WRITE_CONTACTS': 'WRITE_CONTACTS',
  'android.permission.READ_PHONE_STATE': 'READ_PHONE_STATE',
  'android.permission.READ_CALL_LOG': 'READ_CALL_LOG',
  'android.permission.CALL_PHONE': 'CALL_PHONE',
  'android.permission.READ_SMS': 'READ_SMS',
  'android.permission.RECEIVE_SMS': 'RECEIVE_SMS',
  'android.permission.SEND_SMS': 'SEND_SMS',
  'android.permission.READ_EXTERNAL_STORAGE': 'READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES': 'READ_MEDIA_IMAGES',
  'android.permission.BODY_SENSORS': 'BODY_SENSORS',
  'android.permission.ACTIVITY_RECOGNITION': 'ACTIVITY_RECOGNITION',
  'android.permission.READ_CALENDAR': 'READ_CALENDAR',
  'android.permission.WRITE_CALENDAR': 'WRITE_CALENDAR',
  'android.permission.RECEIVE_BOOT_COMPLETED': 'RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE': 'FOREGROUND_SERVICE',
  'android.permission.REQUEST_INSTALL_PACKAGES': 'REQUEST_INSTALL_PACKAGES',
  'android.permission.SYSTEM_ALERT_WINDOW': 'SYSTEM_ALERT_WINDOW',
  'android.permission.BIND_ACCESSIBILITY_SERVICE': 'BIND_ACCESSIBILITY_SERVICE',
  'android.permission.WRITE_SETTINGS': 'WRITE_SETTINGS',
  'android.permission.INTERNET': 'INTERNET',
  'android.permission.ACCESS_WIFI_STATE': 'ACCESS_WIFI_STATE',
  'android.permission.ACCESS_NETWORK_STATE': 'ACCESS_NETWORK_STATE',
  'android.permission.CHANGE_WIFI_STATE': 'CHANGE_WIFI_STATE',
  'android.permission.BLUETOOTH_SCAN': 'BLUETOOTH_SCAN',
  'android.permission.VIBRATE': 'VIBRATE',
  'android.permission.WAKE_LOCK': 'WAKE_LOCK',
  'android.permission.FLASHLIGHT': 'FLASHLIGHT',
  'android.permission.NFC': 'NFC',
  'android.permission.BLUETOOTH': 'BLUETOOTH',
  'android.permission.USE_BIOMETRIC': 'USE_BIOMETRIC',
  'android.permission.POST_NOTIFICATIONS': 'POST_NOTIFICATIONS',
};

/**
 * Starts the native package monitor to listen for newly installed or updated applications.
 * Maps raw system permission strings to database-compatible short names and calculates their risk.
 *
 * @param onInstall - A callback function invoked when a new threat event is identified from an installation.
 * @returns void
 */
export function startPackageMonitor(onInstall: InstallCallback): void {
  if (!NativeMonitor) return;

  try {
    NativeMonitor.startMonitoring();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emitter = new NativeEventEmitter(NativeMonitor as any);
    subscription = emitter.addListener('onPackageInstalled', (event: InstallEvent) => {
      if (event.isSystemApp) return;

      const mappedPermissions = (event.permissions || [])
        .map((p) => (p.startsWith('android.permission.') ? RAW_PERMISSION_MAP[p] || p : p))
        .filter(Boolean);

      const profile = calculateRiskProfile(
        event.packageName,
        event.appName,
        mappedPermissions,
        event.installTime,
        event.installTime,
        false,
        '',
      );

      const threatEvent = buildInstallThreatEvent(profile);
      if (threatEvent) onInstall(threatEvent);
    });
  } catch {
    // Native module unavailable before prebuild - silent no-op
  }
}

/**
 * Stops the native package monitor and unsubscribes from the native package events.
 *
 * @returns void
 */
export function stopPackageMonitor(): void {
  subscription?.remove();
  subscription = null;
  try {
    NativeMonitor?.stopMonitoring();
  } catch {
    // silent
  }
}
