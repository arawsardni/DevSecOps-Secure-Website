"use client";

export default function Layout({ children }) {
    return (
        <div className="w-11/12 md:w-5/6 lg:w-3/4 mx-auto space-y-8">
            {children}
        </div>
    );
}
