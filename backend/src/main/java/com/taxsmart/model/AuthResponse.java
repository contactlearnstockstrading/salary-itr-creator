package com.taxsmart.model;

public class AuthResponse {
    private boolean success;
    private String message;
    private String id;
    private String name;
    private String email;

    public AuthResponse(boolean success, String message, String id, String name, String email) {
        this.success = success;
        this.message = message;
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public boolean isSuccess() { return success; }
    public String getMessage()  { return message; }
    public String getId()       { return id; }
    public String getName()     { return name; }
    public String getEmail()    { return email; }
}
