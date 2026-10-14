package com.alarmyapp

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Swap the yellow cold-start cover back to the app theme before RN draws.
    setTheme(R.style.AppTheme)
    super.onCreate(savedInstanceState)

    // If launched from an alarm notification, apply the wake-up window flags
    // so the screen turns on and stays on while the alarm is ringing.
    if (isAlarmIntent(intent)) {
      applyAlarmWindowFlags()
    }
  }

  /**
   * Called when the activity is already running and a new intent arrives
   * (e.g. a second alarm fires while the app is in the foreground/background).
   * We must re-apply the screen-on flags so the display wakes up again.
   */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    if (isAlarmIntent(intent)) {
      applyAlarmWindowFlags()
    }
  }

  /**
   * Turns the screen on and keeps it on while the alarm ringing screen is visible.
   * Uses the modern API (API 27+) first, falls back to window flags for older devices.
   */
  private fun applyAlarmWindowFlags() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      // API 27+ — preferred, works with keyguard properly
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      // Older devices — legacy window flags
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
      )
    }
    // Keep the screen lit while the alarm is active so the user can interact.
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  /**
   * Clears KEEP_SCREEN_ON after the alarm is dismissed so normal
   * battery-saving screen-off behaviour resumes.
   * Called by JS via DeviceEventEmitter when the alarm is fully dismissed.
   * For now we clear it whenever the activity loses focus.
   */
  override fun onPause() {
    super.onPause()
    // Only clear if no alarm is active — safe to always clear here because
    // the alarm ringing screen will re-apply the flag via onNewIntent/onCreate.
    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
  }

  /** Returns true when the intent originated from a Notifee alarm notification. */
  private fun isAlarmIntent(intent: Intent?): Boolean {
    if (intent == null) return false
    // Notifee sets the action to VIEW or MAIN when launching from a notification.
    // We additionally check that our custom wakely:// deep-link or the default
    // notification launch is the source, not a manual user tap on the icon.
    val action = intent.action
    val data = intent.data
    // wakely://alarm deep-link (from fullScreenAction / pressAction)
    if (data?.scheme == "wakely") return true
    // Notifee fullScreenAction lands with MAIN action and no data URI —
    // we check the notifee bundle extras it attaches.
    val extras = intent.extras
    if (extras != null && (extras.containsKey("notifee_notification_id") ||
          extras.containsKey("notifeeNotificationId"))) return true
    return false
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AlarmyApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
