package com.alarmapp.alarmclock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager

class AlarmClockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val title = intent.getStringExtra("title") ?: "Alarm"
    val id = intent.getStringExtra("id") ?: System.currentTimeMillis().toString()

    val service = Intent(context, AlarmClockService::class.java).apply {
      putExtra("title", title)
      putExtra("id", id)
    }
    // Brief wakelock to ensure service starts while device is dozing/locked
    try {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      @Suppress("DEPRECATION")
      val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP, "AlarmApp:ReceiverLock")
      wl.acquire(15000)
      try {
        context.startForegroundService(service)
      } catch (_: Exception) {
        context.startService(service)
      }
      try { wl.release() } catch (_: Exception) {}
    } catch (_: Exception) {
      try { context.startForegroundService(service) } catch (_: Exception) { context.startService(service) }
    }
  }
}


