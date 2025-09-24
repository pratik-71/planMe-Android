package com.alarmapp.alarmclock

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AlarmClockModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName(): String = "AlarmClockModule"

  @ReactMethod
  fun schedule(id: String, title: String, triggerAtMs: Double, promise: Promise) {
    try {
      val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val op = PendingIntent.getBroadcast(
        ctx,
        id.hashCode(),
        Intent(ctx, AlarmClockReceiver::class.java).apply {
          putExtra("id", id)
          putExtra("title", title)
        },
        PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
      )
      val showIntent = PendingIntent.getActivity(
        ctx,
        id.hashCode() + 1,
        Intent(ctx, com.alarmapp.AlarmActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
      )
      val info = AlarmManager.AlarmClockInfo(triggerAtMs.toLong(), showIntent)
      am.setAlarmClock(info, op)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SCHEDULE_ERROR", e)
    }
  }

  @ReactMethod
  fun cancel(id: String, promise: Promise) {
    try {
      val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val op = PendingIntent.getBroadcast(
        ctx,
        id.hashCode(),
        Intent(ctx, AlarmClockReceiver::class.java),
        PendingIntent.FLAG_NO_CREATE or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
      )
      if (op != null) {
        am.cancel(op)
        op.cancel()
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("CANCEL_ERROR", e)
    }
  }

  @ReactMethod
  fun stopRinging(promise: Promise) {
    try {
      val intent = Intent(ctx, AlarmClockService::class.java).apply { action = "STOP" }
      ctx.startService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STOP_ERROR", e)
    }
  }
}


