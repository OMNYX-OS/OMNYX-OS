package expo.modules.packagemonitor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * PackageMonitorModule - watches for app installs and updates.
 *
 * Security notes:
 * - Only listen for ACTION_PACKAGE_ADDED and ACTION_PACKAGE_REPLACED.
 * - Returns only package name, app name, and permission list.
 * - BroadcastReceiver is unregistered on module destroy to prevent leaks.
 */
class PackageMonitorModule : Module() {

    private var receiver: BroadcastReceiver? = null

    override fun definition() = ModuleDefinition {
        Name("OmnyxPackageMonitor")

        Events("onPackageInstalled")

        Function("startMonitoring") {
            val ctx = appContext.reactContext
            if (ctx != null && receiver == null) {
                receiver = object : BroadcastReceiver() {
                    override fun onReceive(context: Context, intent: Intent) {
                        val packageName = intent.data?.schemeSpecificPart ?: return
                        val isUpdate = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)
                        val appData = buildAppData(context, packageName, isUpdate)
                        sendEvent("onPackageInstalled", appData)
                    }
                }
                val filter = IntentFilter().apply {
                    addAction(Intent.ACTION_PACKAGE_ADDED)
                    addAction(Intent.ACTION_PACKAGE_REPLACED)
                    addDataScheme("package")
                }
                ctx.registerReceiver(receiver, filter)
            }
            null
        }

        Function("stopMonitoring") {
            val ctx = appContext.reactContext
            if (ctx != null) {
                receiver?.let { ctx.unregisterReceiver(it) }
                receiver = null
            }
            null
        }

        OnDestroy {
            val ctx = appContext.reactContext
            receiver?.let { ctx?.unregisterReceiver(it) }
            receiver = null
        }
    }

    private fun buildAppData(context: Context, packageName: String, isUpdate: Boolean): Map<String, Any> {
        return try {
            val pm = context.packageManager
            val info = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val appInfo = info.applicationInfo
            val appName = if (appInfo != null) {
                try { pm.getApplicationLabel(appInfo).toString().trim() } catch (_: Exception) { packageName }
            } else {
                packageName
            }
            val rawPerms = info.requestedPermissions ?: emptyArray()
            val permissions = rawPerms
                .mapNotNull { fullName -> PERMISSION_MAP[fullName] }
                .distinct()
            val isSystemApp = if (appInfo != null) {
                (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
            } else {
                false
            }
            mapOf(
                "packageName" to packageName,
                "appName" to appName,
                "permissions" to permissions,
                "isUpdate" to isUpdate,
                "isSystemApp" to isSystemApp,
                "installTime" to info.firstInstallTime,
            )
        } catch (_: Exception) {
            mapOf(
                "packageName" to packageName,
                "appName" to packageName,
                "permissions" to emptyList<String>(),
                "isUpdate" to isUpdate,
                "isSystemApp" to false,
                "installTime" to System.currentTimeMillis(),
            )
        }
    }

    companion object {
        private val PERMISSION_MAP = mapOf(
            "android.permission.ACCESS_FINE_LOCATION"        to "ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION"      to "ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION"  to "ACCESS_BACKGROUND_LOCATION",
            "android.permission.RECORD_AUDIO"                to "RECORD_AUDIO",
            "android.permission.CAMERA"                      to "CAMERA",
            "android.permission.READ_CONTACTS"               to "READ_CONTACTS",
            "android.permission.WRITE_CONTACTS"              to "WRITE_CONTACTS",
            "android.permission.READ_PHONE_STATE"            to "READ_PHONE_STATE",
            "android.permission.READ_CALL_LOG"               to "READ_CALL_LOG",
            "android.permission.CALL_PHONE"                  to "CALL_PHONE",
            "android.permission.READ_SMS"                    to "READ_SMS",
            "android.permission.RECEIVE_SMS"                 to "RECEIVE_SMS",
            "android.permission.SEND_SMS"                    to "SEND_SMS",
            "android.permission.READ_EXTERNAL_STORAGE"       to "READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE"      to "WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES"           to "READ_MEDIA_IMAGES",
            "android.permission.BODY_SENSORS"                to "BODY_SENSORS",
            "android.permission.ACTIVITY_RECOGNITION"        to "ACTIVITY_RECOGNITION",
            "android.permission.READ_CALENDAR"               to "READ_CALENDAR",
            "android.permission.WRITE_CALENDAR"              to "WRITE_CALENDAR",
            "android.permission.RECEIVE_BOOT_COMPLETED"      to "RECEIVE_BOOT_COMPLETED",
            "android.permission.FOREGROUND_SERVICE"          to "FOREGROUND_SERVICE",
            "android.permission.REQUEST_INSTALL_PACKAGES"    to "REQUEST_INSTALL_PACKAGES",
            "android.permission.SYSTEM_ALERT_WINDOW"         to "SYSTEM_ALERT_WINDOW",
            "android.permission.BIND_ACCESSIBILITY_SERVICE"  to "BIND_ACCESSIBILITY_SERVICE",
            "android.permission.WRITE_SETTINGS"              to "WRITE_SETTINGS",
            "android.permission.INTERNET"                    to "INTERNET",
            "android.permission.ACCESS_WIFI_STATE"           to "ACCESS_WIFI_STATE",
            "android.permission.ACCESS_NETWORK_STATE"        to "ACCESS_NETWORK_STATE",
            "android.permission.CHANGE_WIFI_STATE"           to "CHANGE_WIFI_STATE",
            "android.permission.BLUETOOTH_SCAN"              to "BLUETOOTH_SCAN",
            "android.permission.VIBRATE"                     to "VIBRATE",
            "android.permission.WAKE_LOCK"                   to "WAKE_LOCK",
            "android.permission.FLASHLIGHT"                  to "FLASHLIGHT",
            "android.permission.NFC"                         to "NFC",
            "android.permission.BLUETOOTH"                   to "BLUETOOTH",
            "android.permission.USE_BIOMETRIC"               to "USE_BIOMETRIC",
            "android.permission.POST_NOTIFICATIONS"          to "POST_NOTIFICATIONS",
        )
    }
}
