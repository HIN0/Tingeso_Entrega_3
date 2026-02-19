package app.controllers;

import app.dtos.UserRequest;
import app.entities.UserEntity;
import app.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private UserService userService;

    @GetMapping
    public List<UserEntity> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping
    public ResponseEntity<Object> createUser(@RequestBody UserRequest userRequest) {
        // Mapeo manual del DTO a la Entidad (o puedes usar ModelMapper/MapStruct)
        UserEntity user = new UserEntity();
        user.setUsername(userRequest.getUsername());
        user.setPassword(userRequest.getPassword());
        user.setEmail(userRequest.getEmail());
        user.setRole(userRequest.getRole());
        
        return ResponseEntity.ok(userService.saveUser(user));
    }
}