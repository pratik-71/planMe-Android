package com.alarmapp.alarmclock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmClockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val title = intent.getStringExtra("title") ?: "Alarm"
    val id = intent.getStringExtra("id") ?: System.currentTimeMillis().toString()

    val service = Intent(context, AlarmClockService::class.java).apply {
      putExtra("title", title)
      putExtra("id", id)
    }
    try {
      context.startForegroundService(service)
    } catch (_: Exception) {
      context.startService(service)
    }
  }
}


