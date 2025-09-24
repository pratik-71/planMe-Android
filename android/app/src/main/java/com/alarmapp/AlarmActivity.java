package com.alarmapp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Toast;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import android.os.Build;
import android.os.Bundle;
import android.content.Intent;
import android.app.KeyguardManager;
import android.view.WindowManager;

public class AlarmActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Make this activity full screen and keep screen on
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_FULLSCREEN |
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
      WindowManager.LayoutParams.FLAG_FULLSCREEN |
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    );

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
      try {
        KeyguardManager kgm = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (kgm != null) {
          kgm.requestDismissKeyguard(this, null);
        }
      } catch (Exception ignored) {}
    }
  }

  @Override
  protected String getMainComponentName() {
    return "AlarmApp";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
      this,
      getMainComponentName(),
      DefaultNewArchitectureEntryPoint.getFabricEnabled()
    );
  }

  protected Bundle getLaunchOptions() {
    Intent intent = getIntent();
    Bundle b = new Bundle();
    if (intent != null) {
      String slotTitle = intent.getStringExtra("slotTitle");
      String slotId = intent.getStringExtra("slotId");
      if (slotId != null) {
        b.putString("slotId", slotId);
        if (slotTitle != null) b.putString("slotTitle", slotTitle);
      }
    }
    return b;
  }

  @Override
  public void onBackPressed() {
    // Prevent back button from closing the alarm
    // User must tap "Open App" button
  }
}
