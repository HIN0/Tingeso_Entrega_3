package app.dtos;

import app.entities.enums.UserRole;
import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private String email;
    private String password;
    private UserRole role;
}