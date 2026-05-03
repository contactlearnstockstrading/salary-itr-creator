package com.taxsmart.service;

import com.taxsmart.model.AuthRequest;
import com.taxsmart.model.AuthResponse;
import com.taxsmart.model.User;
import com.taxsmart.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthResponse signup(AuthRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse(false, "Email is required", null, null, null);
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return new AuthResponse(false, "Password must be at least 6 characters", null, null, null);
        }
        if (request.getName() == null || request.getName().isBlank()) {
            return new AuthResponse(false, "Name is required", null, null, null);
        }
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            return new AuthResponse(false, "An account with this email already exists", null, null, null);
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        return new AuthResponse(true, "Account created successfully", saved.getId(), saved.getName(), saved.getEmail());
    }

    public AuthResponse login(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return new AuthResponse(false, "Email and password are required", null, null, null);
        }

        return userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .map(user -> {
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        return new AuthResponse(true, "Login successful", user.getId(), user.getName(), user.getEmail());
                    }
                    return new AuthResponse(false, "Incorrect password", null, null, null);
                })
                .orElse(new AuthResponse(false, "No account found with this email", null, null, null));
    }
}
