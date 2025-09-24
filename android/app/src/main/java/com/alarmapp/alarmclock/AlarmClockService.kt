package com.alarmapp.alarmclock

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.alarmapp.AlarmActivity
import com.alarmapp.R
import android.os.PowerManager
import android.os.Handler
import android.os.Looper

class AlarmClockService : Service() {
  private val channelId = "alarm-channel"
  private var mediaPlayer: MediaPlayer? = null
  private var audioManager: AudioManager? = null
  private var focusRequest: AudioFocusRequest? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra("title") ?: "Alarm"
    val id = intent?.getStringExtra("id") ?: System.currentTimeMillis().toString()
    if (intent?.action == "STOP") {
      try { mediaPlayer?.stop(); mediaPlayer?.release() } catch (_: Exception) {}
      mediaPlayer = null
      try { wakeLock?.release() } catch (_: Exception) {}
      wakeLock = null
      stopForeground(true)
      stopSelf()
      return START_NOT_STICKY
    }

    ensureChannel()

    val activityIntent = Intent(this, AlarmActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra("slotTitle", title)
      putExtra("slotId", id)
    }
    val fullPending = PendingIntent.getActivity(
      this, 0, activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    )

    val stopIntent = Intent(this, AlarmClockService::class.java).apply { action = "STOP" }
    val stopPending = PendingIntent.getService(
      this, 1, stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0
    )

    val notif: Notification = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("\uD83D\uDEA8 ALARM")
      .setContentText(title)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setOngoing(true)
      .setAutoCancel(false)
      .setFullScreenIntent(fullPending, true)
      .addAction(R.mipmap.ic_launcher, "Stop", stopPending)
      .build()

    try {
      startForeground(1201, notif)
    } catch (_: Exception) { /* ignore */ }

    // Acquire a short wake lock to help turn on screen for older devices
    try {
      val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
      @Suppress("DEPRECATION")
      val wl = pm.newWakeLock(
        PowerManager.SCREEN_DIM_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
        "AlarmApp:AlarmWakeLock",
      )
      wl.acquire(15000)
      wakeLock = wl
    } catch (_: Exception) {}

    // Try launching activity immediately and again after a short delay
    try { startActivity(activityIntent) } catch (_: Exception) {}
    Handler(Looper.getMainLooper()).postDelayed({
      try { startActivity(activityIntent) } catch (_: Exception) {}
    }, 800)

    startRinging()
    return START_NOT_STICKY
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(channelId, "Alarms", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Alarm notifications"
        enableVibration(true)
        enableLights(true)
        lightColor = Color.RED
        setBypassDnd(true)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
      nm.createNotificationChannel(channel)
    }
  }

  private fun startRinging() {
    try {
      audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
          .setAudioAttributes(attrs)
          .setOnAudioFocusChangeListener { }
          .build()
        audioManager?.requestAudioFocus(focusRequest!!)
      } else {
        @Suppress("DEPRECATION")
        audioManager?.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      }
      val alarmUri: Uri =
        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
          ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      mediaPlayer = MediaPlayer().apply {
        setAudioAttributes(attrs)
        setDataSource(this@AlarmClockService, alarmUri)
        isLooping = true
        prepare()
        start()
      }
    } catch (_: Exception) {}
  }

  // No onStart override; STOP handled in onStartCommand
}


