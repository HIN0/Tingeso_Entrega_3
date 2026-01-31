package controllers;

import entities.UserEntity;
import services.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin("*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserEntity createUser(@RequestBody UserEntity user) {
        return userService.createUser(user);
    }

    @GetMapping("/{username}")
    public Optional<UserEntity> getUserByUsername(@PathVariable String username) {
        return userService.findByUsername(username);
    }
}
