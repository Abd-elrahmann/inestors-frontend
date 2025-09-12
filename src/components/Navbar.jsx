import React, { useState, useEffect } from "react";
import {
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  MdMenu as MenuIcon,
  MdMenuOpen as MenuOpenIcon,
  MdPerson as Person,
  MdExitToApp as ExitToApp,
} from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser, updateUserProfile } from "../utils/user";
import Logo from "../assets/images/logo.webp";

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useUser();
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    updateUserProfile(null);  
    handleUserMenuClose();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate("/profile");
  };

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1201,
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderBottom: "1px solid #e0e0e0",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", direction: "rtl" }}>
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {profile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="toggle sidebar"
                onClick={() => {
                  onMenuToggle();
                  window.dispatchEvent(new Event("sidebarToggle"));
                }}
                sx={{
                  color: "#28a745",
                  mr: 1,
                  transition: "all 0.01s ease",
                  "&:hover": {
                    backgroundColor: "rgba(40, 167, 69, 0.1)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
              </IconButton>
            )}

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap:1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 600,
                  color: "#28a745",
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img src={Logo} alt="Logo" style={{ width: "50px", height: "50px" }} />
                <span>نظام إدارة المساهمين</span>
              </Typography>
            </Box>
          </Box>
        </div>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {profile ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Box sx={{ textAlign: "right", mr: 2, display: "block" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Cairo",
                    color: "#666",
                    fontSize: "0.85rem",
                  }}
                >
                  مرحباً
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 600,
                    color: "#28a745",
                  }}
                >
                  {profile.fullName.split(" ")[0]}
                </Typography>
              </Box>
              <IconButton onClick={handleUserMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  src={profile?.profileImage || undefined}
                  sx={{
                    bgcolor: "#28a745",
                    width: 40,
                    height: 40,
                    fontSize: "1.2rem",
                    fontFamily: "Cairo",
                  }}
                >
                  {!profile?.profileImage && profile?.fullName?.charAt(0)}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                sx={{
                  "& .MuiMenuItem-root": {
                    fontFamily: "Cairo",
                    direction: "rtl",
                  },
                }}
              >
                <MenuItem onClick={handleProfile}>
                  <Person sx={{ mr: 1, ml: 0 }} />
                  الملف الشخصي
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1, ml: 0 }} />
                  تسجيل الخروج
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                color="inherit"
                onClick={() => navigate("/register")}
                sx={{
                  fontFamily: "Cairo",
                  color: "#28a745",
                  "&:hover": {
                    backgroundColor: "rgba(40, 167, 69, 0.1)",
                  },
                }}
              >
                إنشاء حساب
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  fontFamily: "Cairo",
                  backgroundColor: "#28a745",
                  "&:hover": {
                    backgroundColor: "#218838",
                  },
                }}
              >
                تسجيل الدخول
              </Button>
            </div>
          )}
        </Box>
      </Toolbar>
    </div>
  );
};

export default Navbar;
