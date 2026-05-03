package com.taxsmart.model;

import lombok.Data;

@Data
public class AuthRequest {
    private String name;     // only for signup
    private String email;
    private String password;
}
