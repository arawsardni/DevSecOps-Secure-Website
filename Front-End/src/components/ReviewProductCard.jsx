import { formatRelativeDate } from "@/lib/utils";

export default function ReviewProductCard({
  user,
  rating,
  comment,
  date,
  avatar,
}) {
  // Fungsi untuk mendapatkan inisial dari nama pengguna
  const getInitials = (name) => {
    if (!name) return "P";

    // Jika nama pengguna berisi spasi (nama lengkap), ambil inisial dari kata pertama dan kedua
    const words = name.trim().split(" ");
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    // Jika hanya satu kata, ambil huruf pertama
    return name[0].toUpperCase();
  };

  // Check if avatar is valid before rendering
  const isValidAvatar =
    avatar && typeof avatar === "string" && avatar.trim() !== "";

  return (
    <div className="border rounded-lg p-4 bg-white space-y-2 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Render avatar only if it's valid, otherwise always show initials */}
          {isValidAvatar ? (
            <img
              src={avatar}
              alt={user}
              className="w-8 h-8 object-cover rounded-full"
              onError={(e) => {
                // Use a ref to avoid infinite loop
                e.currentTarget.onerror = null;
                // Hide the image if it fails to load
                e.currentTarget.style.display = "none";
                // Make sure the initials avatar is shown
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = "flex";
                }
              }}
            />
          ) : null}

          {/* Avatar Inisial - always define, but hide if avatar loads successfully */}
          <div
            className={`w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold ${
              isValidAvatar ? "hidden" : "flex"
            }`}
          >
            {getInitials(user)}
          </div>

          <div>
            <p className="font-semibold text-sm text-gray-700">{user}</p>
            <p className="text-xs text-gray-400">{formatRelativeDate(date)}</p>
          </div>
        </div>

        {/* Rating */}
        <span className="text-yellow-500 text-sm whitespace-nowrap">
          {"★".repeat(rating)}
          {"☆".repeat(5 - rating)}
        </span>
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-600 leading-relaxed">{comment}</p>
    </div>
  );
}
