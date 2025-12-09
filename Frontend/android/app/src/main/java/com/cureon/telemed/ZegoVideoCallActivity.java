package com.cureon.telemed;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.zegocloud.uikit.prebuilt.call.ZegoUIKitPrebuiltCallConfig;
import com.zegocloud.uikit.prebuilt.call.ZegoUIKitPrebuiltCallFragment;
import com.zegocloud.uikit.prebuilt.call.config.ZegoHangUpConfirmDialogInfo;

import java.util.ArrayList;
import java.util.List;

public class ZegoVideoCallActivity extends AppCompatActivity {
    private static final String TAG = "ZegoVideoCallActivity";
    private static final int PERMISSION_REQUEST_CODE = 200;
    
    // ZegoCloud credentials - MUST match your .env file exactly
    private static final long APP_ID = 1970983545L;
    private static final String APP_SIGN = "b460cb2b3b763f4dad0f205c83b8339575a9f323f723a0afb9e8a60b7d60f08e";

    private String roomID;
    private String userID;
    private String userName;
    private boolean isVideoCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "onCreate started");
        
        try {
            // Make fullscreen - must be before setContentView
            requestWindowFeature(Window.FEATURE_NO_TITLE);
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            
            // Keep screen on during call
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            
            // Hide system UI for immersive mode
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }

            setContentView(R.layout.activity_zego_video_call);
            Log.d(TAG, "Layout set successfully");

            // Force layout to be measured immediately
            View rootView = findViewById(android.R.id.content);
            if (rootView != null) {
                rootView.post(() -> {
                    rootView.requestLayout();
                    Log.d(TAG, "Layout pass requested");
                });
            }

            // Get data from intent
            roomID = getIntent().getStringExtra("roomID");
            userID = getIntent().getStringExtra("userID");
            userName = getIntent().getStringExtra("userName");
            isVideoCall = getIntent().getBooleanExtra("isVideoCall", true);

            Log.d(TAG, "Starting video call - Room: " + roomID + ", User: " + userID + ", Name: " + userName);
            Log.d(TAG, "Using APP_ID: " + APP_ID);

            if (roomID == null || roomID.isEmpty()) {
                roomID = "default-room";
            }
            if (userID == null || userID.isEmpty()) {
                userID = "user_" + System.currentTimeMillis();
            }
            if (userName == null || userName.isEmpty()) {
                userName = "User";
            }

            // Sanitize userID - only allow alphanumeric and underscore
            userID = userID.replaceAll("[^a-zA-Z0-9_]", "_");

            // Check and request permissions before starting call
            if (checkPermissions()) {
                Log.d(TAG, "Permissions already granted, starting call");
                addCallFragment(roomID, userID, userName, isVideoCall);
            } else {
                Log.d(TAG, "Requesting permissions");
                requestPermissions();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate: " + e.getMessage(), e);
            Toast.makeText(this, "Failed to start video call: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private boolean checkPermissions() {
        boolean hasCam = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            == PackageManager.PERMISSION_GRANTED;
        boolean hasMic = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
            == PackageManager.PERMISSION_GRANTED;
        
        Log.d(TAG, "Permissions check - Camera: " + hasCam + ", Mic: " + hasMic);
        return hasCam && hasMic;
    }

    private void requestPermissions() {
        List<String> permissions = new ArrayList<>();
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
                != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }

        if (!permissions.isEmpty()) {
            Log.d(TAG, "Requesting permissions: " + permissions);
            ActivityCompat.requestPermissions(this, 
                permissions.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int i = 0; i < permissions.length; i++) {
                boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                Log.d(TAG, "Permission " + permissions[i] + ": " + (granted ? "GRANTED" : "DENIED"));
                if (!granted) {
                    allGranted = false;
                }
            }
            
            if (allGranted) {
                // All permissions granted, start the call
                addCallFragment(roomID, userID, userName, isVideoCall);
            } else {
                // Permissions denied, show message and close
                Toast.makeText(this, "Camera and microphone permissions are required for video calls", 
                    Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private void addCallFragment(String roomID, String userID, String userName, boolean isVideoCall) {
        try {
            Log.d(TAG, "=== addCallFragment START ===");
            Log.d(TAG, "roomID: " + roomID);
            Log.d(TAG, "userID: " + userID);
            Log.d(TAG, "userName: " + userName);
            Log.d(TAG, "isVideoCall: " + isVideoCall);
            Log.d(TAG, "APP_ID: " + APP_ID);
            Log.d(TAG, "APP_SIGN length: " + (APP_SIGN != null ? APP_SIGN.length() : 0));
            
            // Validate inputs
            if (APP_ID <= 0) {
                Log.e(TAG, "Invalid APP_ID!");
                Toast.makeText(this, "Invalid ZegoCloud App ID", Toast.LENGTH_LONG).show();
                finish();
                return;
            }
            
            if (APP_SIGN == null || APP_SIGN.isEmpty()) {
                Log.e(TAG, "Invalid APP_SIGN!");
                Toast.makeText(this, "Invalid ZegoCloud App Sign", Toast.LENGTH_LONG).show();
                finish();
                return;
            }
            
            // Configure for 1-on-1 video call
            Log.d(TAG, "Creating call config...");
            ZegoUIKitPrebuiltCallConfig config = isVideoCall 
                ? ZegoUIKitPrebuiltCallConfig.oneOnOneVideoCall()
                : ZegoUIKitPrebuiltCallConfig.oneOnOneVoiceCall();

            // Customize the config for better video rendering
            config.turnOnCameraWhenJoining = isVideoCall;
            config.turnOnMicrophoneWhenJoining = true;
            config.useSpeakerWhenJoining = true;

            // IMPORTANT: Enable video view when user joins - prevents black screen
            config.audioVideoViewConfig.useVideoViewAspectFill = true;

            // Add hang up confirmation
            config.hangUpConfirmDialogInfo = new ZegoHangUpConfirmDialogInfo();
            config.hangUpConfirmDialogInfo.title = "End Call";
            config.hangUpConfirmDialogInfo.message = "Are you sure you want to end this call?";
            config.hangUpConfirmDialogInfo.confirmButtonName = "End";
            config.hangUpConfirmDialogInfo.cancelButtonName = "Cancel";

            Log.d(TAG, "Creating ZegoUIKitPrebuiltCallFragment...");

            ZegoUIKitPrebuiltCallFragment fragment = ZegoUIKitPrebuiltCallFragment.newInstance(
                APP_ID,
                APP_SIGN,
                userID,
                userName,
                roomID,
                config
            );

            if (fragment == null) {
                Log.e(TAG, "Fragment is null! ZegoCloud SDK may not be properly initialized.");
                Toast.makeText(this, "Failed to create video call. Please try again.", Toast.LENGTH_LONG).show();
                finish();
                return;
            }

            Log.d(TAG, "Fragment created successfully");

            // Set callback for when call ends
            fragment.setOnOnlySelfInRoomListener(() -> {
                Log.d(TAG, "Only self in room, finishing activity");
                runOnUiThread(() -> {
                    Toast.makeText(ZegoVideoCallActivity.this, "Call ended", Toast.LENGTH_SHORT).show();
                    finish();
                });
            });

            Log.d(TAG, "Adding fragment to container R.id.zego_call_container...");
            
            // Check if container exists
            View container = findViewById(R.id.zego_call_container);
            if (container == null) {
                Log.e(TAG, "Container view not found!");
                Toast.makeText(this, "Layout error. Please try again.", Toast.LENGTH_LONG).show();
                finish();
                return;
            }
            
            Log.d(TAG, "Container found, committing fragment transaction...");
            
            getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.zego_call_container, fragment)
                .commitNow();

            Log.d(TAG, "=== ZegoUIKitPrebuiltCallFragment added successfully ===");

        } catch (Exception e) {
            Log.e(TAG, "Error creating call fragment: " + e.getMessage(), e);
            e.printStackTrace();
            Toast.makeText(this, "Video call error: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    @Override
    public void onBackPressed() {
        // Show confirmation dialog instead of immediately closing
        // The ZegoUIKit handles this via hangUpConfirmDialogInfo
        super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "ZegoVideoCallActivity destroyed");
    }
}
