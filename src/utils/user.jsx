import { useState, useEffect } from 'react';

export const useUser = () => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const profile = localStorage.getItem("profile");
    
    if (!token) {
      return null;
    }
    
    return profile ? JSON.parse(profile) : { role: "ADMIN" };
  });

  // دالة لتحديث البروفايل مباشرة
  const updateProfile = (newProfileData) => {
    const updatedProfile = { ...user, ...newProfileData };
    setUser(updatedProfile);
    localStorage.setItem("profile", JSON.stringify(updatedProfile));
    window.dispatchEvent(new CustomEvent('userProfileUpdate'));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const profile = localStorage.getItem("profile");
      
      if (!token) {
        setUser(null);
        return;
      }
      
      setUser(profile ? JSON.parse(profile) : { role: "ADMIN" });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdate', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdate', handleStorageChange);
    };
  }, []);

  return { user, updateProfile };
};

export const updateUserProfile = () => {
  window.dispatchEvent(new CustomEvent('userProfileUpdate'));
};