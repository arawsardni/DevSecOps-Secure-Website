import { formatRelativeDate } from '@/lib/utils'

export default function ReviewProductCard({ user, rating, comment, date }) {
    return (
        <div className="border rounded-lg p-4 bg-white space-y-2 shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Avatar Dummy */}
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user[0]}
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
            <p className="text-sm text-gray-600 leading-relaxed">
                {comment}
            </p>
        </div>
    );
}