package com.cureon.telemed;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ZegoCall")
public class ZegoCallPlugin extends Plugin {
    private static final String TAG = "ZegoCallPlugin";
    private boolean isInitialized = false;
    private String currentUserID = "";
    private String currentUserName = "";

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            long appID = call.getLong("appID", 0L);
            String appSign = call.getString("appSign", "");
            String userID = call.getString("userID", "");
            String userName = call.getString("userName", "");

            Log.d(TAG, "Initializing with appID: " + appID + ", userID: " + userID);

            if (appID == 0 || appSign == null || appSign.isEmpty()) {
                call.reject("Invalid appID or appSign");
                return;
            }

            if (userID == null || userID.isEmpty()) {
                call.reject("Invalid userID");
                return;
            }

            currentUserID = userID.replaceAll("[^a-zA-Z0-9_]", "_");
            currentUserName = (userName != null && !userName.isEmpty()) ? userName : "User";
            isInitialized = true;

            Log.d(TAG, "ZegoCloud plugin initialized successfully");

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "ZegoCloud initialized");
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Init failed: " + e.getMessage(), e);
            call.reject("Failed to initialize: " + e.getMessage());
        }
    }


    @PluginMethod
    public void joinRoom(PluginCall call) {
        try {
            String roomID = call.getString("roomID", "");
            String userID = call.getString("userID", currentUserID);
            String userName = call.getString("userName", currentUserName);
            boolean isVideoCall = call.getBoolean("isVideoCall", true);

            Log.d(TAG, "Joining room: " + roomID + ", userID: " + userID);

            if (roomID == null || roomID.isEmpty()) {
                call.reject("Invalid roomID");
                return;
            }

            final String sanitizedUserID = userID.replaceAll("[^a-zA-Z0-9_]", "_");
            final String finalUserName = (userName != null && !userName.isEmpty()) ? userName : "User";
            final String finalRoomID = roomID;
            final boolean finalIsVideoCall = isVideoCall;

            getActivity().runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(getActivity(), ZegoVideoCallActivity.class);
                    intent.putExtra("roomID", finalRoomID);
                    intent.putExtra("userID", sanitizedUserID);
                    intent.putExtra("userName", finalUserName);
                    intent.putExtra("isVideoCall", finalIsVideoCall);
                    getActivity().startActivity(intent);

                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("message", "Joining room: " + finalRoomID);
                    call.resolve(result);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to join room: " + e.getMessage(), e);
                    call.reject("Failed to join room: " + e.getMessage());
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Error in joinRoom: " + e.getMessage(), e);
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void endCall(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Call ended");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error ending call: " + e.getMessage(), e);
            call.reject("Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void uninitialize(PluginCall call) {
        try {
            isInitialized = false;
            currentUserID = "";
            currentUserName = "";
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "ZegoCloud uninitialized");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error uninitializing: " + e.getMessage(), e);
            call.reject("Error: " + e.getMessage());
        }
    }
}
