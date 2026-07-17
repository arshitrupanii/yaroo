import { useState } from "react";
import { useAuthStore } from "../store/useAuhstore";
import { Camera, Mail, User } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePicture: base64Image });
    };
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-base-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-1 text-sm text-base-content/60">Manage your account details.</p>
          </div>

          <div className="flex flex-col items-center gap-3 border-b border-base-300 pb-8">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePicture || "/avatar.png"}
                alt="Profile"
                className="size-28 rounded-full object-cover border border-base-300"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  btn btn-circle btn-sm btn-primary
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-base-content/50">
              {isUpdatingProfile ? "Uploading..." : "Upload a profile photo"}
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="input input-bordered flex items-center">{authUser?.firstname}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="input input-bordered flex items-center">{authUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
              <p className="input input-bordered flex items-center">@{authUser?.username || "not-set"}</p>
            </div>
          </div>

          <div className="border-t border-base-300 pt-6">
            <h2 className="text-lg font-medium mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
