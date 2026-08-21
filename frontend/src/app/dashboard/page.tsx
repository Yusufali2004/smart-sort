"use client";

import AuthGuard from "@/components/AuthGuard";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type WasteRecord = {
    id: string;
    ai_category: string | null;
    ai_confidence: number | null;
    final_category: string;
    material: string | null;
    quantity: number;
    weight_grams: number | null;
    disposal_method: string | null;
    carbon_impact_co2e: number | null;
    created_at: string;
};

const RECYCLABLE = new Set([
    "paper",
    "cardboard",
    "plastic",
    "metal",
    "glass",
    "brown-glass",
    "white-glass",
    "recyclable",
]);

export default function DashboardPage() {
    const router = useRouter();

    const [records, setRecords] = useState<WasteRecord[]>([]);
    const [fullName, setFullName] = useState("there");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            // Profile
            const { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", user.id)
                    .maybeSingle();

            if (profileError) {
                console.error(
                    "Profile loading error:",
                    profileError
                );
            }

            if (profile?.full_name) {
                setFullName(profile.full_name);
            }

            // Waste records
            const { data, error } = await supabase
                .from("waste_records")
                .select(
                    `
            id,
            ai_category,
            ai_confidence,
            final_category,
            material,
            quantity,
            weight_grams,
            disposal_method,
            carbon_impact_co2e,
            created_at
          `
                )
                .eq("user_id", user.id)
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                console.error(
                    "Dashboard records error:",
                    error
                );
            } else {
                setRecords(data ?? []);
            }

            setLoading(false);
        };

        loadDashboard();
    }, [router]);

    const totalScans = records.length;

    const recyclableCount = records.reduce(
        (total, record) => {
            const category = (
                record.final_category ||
                record.ai_category ||
                ""
            ).toLowerCase();

            return (
                total +
                (RECYCLABLE.has(category) ? 1 : 0)
            );
        },
        0
    );

    // IMPORTANT:
    // ai_confidence is already stored as 0-100.
    const averageConfidence =
        totalScans === 0
            ? 0
            : records.reduce(
                (sum, record) =>
                    sum + Number(record.ai_confidence ?? 0),
                0
            ) / totalScans;

    const totalCarbon = records.reduce(
        (sum, record) =>
            sum +
            Number(record.carbon_impact_co2e ?? 0),
        0
    );

    const totalQuantity = records.reduce(
        (sum, record) =>
            sum + Number(record.quantity || 0),
        0
    );

    const totalWeightKg =
        records.reduce(
            (sum, record) =>
                sum + Number(record.weight_grams || 0),
            0
        ) / 1000;

    const distribution = useMemo(() => {
        const counts: Record<string, number> = {};

        records.forEach((record) => {
            const category = (
                record.final_category ||
                record.ai_category ||
                "unknown"
            ).toLowerCase();

            counts[category] =
                (counts[category] || 0) + 1;
        });

        return Object.entries(counts).sort(
            (a, b) => b[1] - a[1]
        );
    }, [records]);

    const logout = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    if (loading) {
        return (
            <AuthGuard>
                <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-10 w-10 mx-auto mb-4 rounded-full border-4 border-gray-700 border-t-green-500 animate-spin" />

                        <p className="text-gray-400">
                            Loading your dashboard...
                        </p>
                    </div>
                </main>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <main className="min-h-screen bg-gray-950 text-white">
                {/* Navbar */}
                <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={() =>
                                router.push("/dashboard")
                            }
                            className="text-2xl font-black tracking-tight"
                        >
                            Smart
                            <span className="text-green-400">
                                Sort
                            </span>
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/")}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-900 transition"
                            >
                                Scan Waste
                            </button>

                            <button
                                onClick={logout}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="max-w-7xl mx-auto px-6 py-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                        <div>
                            <p className="text-green-400 text-sm font-semibold mb-2">
                                SMARTSORT DASHBOARD
                            </p>

                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                Welcome,{" "}
                                {fullName.split(" ")[0]} 👋
                            </h1>

                            <p className="text-gray-500 mt-3">
                                Track your waste classification
                                and environmental impact.
                            </p>
                        </div>

                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 font-bold shadow-lg shadow-green-500/10 hover:from-green-500 hover:to-green-400 transition"
                        >
                            + Scan New Waste
                        </button>
                    </div>

                    {/* Stats */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            label="Total Scans"
                            value={totalScans.toString()}
                            description="All-time classifications"
                        />

                        <StatCard
                            label="Recyclable"
                            value={recyclableCount.toString()}
                            description="Potentially recyclable items"
                        />

                        <StatCard
                            label="Avg. Confidence"
                            value={`${averageConfidence.toFixed(
                                1
                            )}%`}
                            description="AI classification confidence"
                        />

                        <StatCard
                            label="CO₂ Impact"
                            value={totalCarbon.toFixed(2)}
                            description="Estimated CO₂e"
                        />
                    </section>

                    {/* Main */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Distribution */}
                        <div className="lg:col-span-2 rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">
                                    Waste Distribution
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Breakdown of your classified waste.
                                </p>
                            </div>

                            {distribution.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-5">
                                    {distribution.map(
                                        ([category, count]) => {
                                            const percentage =
                                                (count / totalScans) *
                                                100;

                                            return (
                                                <div key={category}>
                                                    <div className="flex justify-between mb-2">
                                                        <span className="capitalize font-semibold">
                                                            {category}
                                                        </span>

                                                        <span className="text-sm text-gray-500">
                                                            {count}{" "}
                                                            {count === 1
                                                                ? "scan"
                                                                : "scans"}{" "}
                                                            ·{" "}
                                                            {percentage.toFixed(
                                                                0
                                                            )}
                                                            %
                                                        </span>
                                                    </div>

                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Activity */}
                        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
                            <h2 className="text-xl font-bold mb-2">
                                Your Activity
                            </h2>

                            <p className="text-sm text-gray-500 mb-6">
                                A quick look at your SmartSort
                                usage.
                            </p>

                            <div className="space-y-4">
                                <InfoRow
                                    label="Total quantity"
                                    value={totalQuantity.toString()}
                                />

                                <InfoRow
                                    label="Recorded weight"
                                    value={`${totalWeightKg.toFixed(
                                        2
                                    )} kg`}
                                />

                                <InfoRow
                                    label="Recyclable rate"
                                    value={
                                        totalScans
                                            ? `${(
                                                (recyclableCount /
                                                    totalScans) *
                                                100
                                            ).toFixed(1)}%`
                                            : "0%"
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    {/* Recent scans */}
                    <section className="mt-6 rounded-3xl border border-gray-800 bg-gray-900/60 overflow-hidden">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold">
                                Recent Scans
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                Your latest waste classifications.
                            </p>
                        </div>

                        {records.length === 0 ? (
                            <div className="p-12">
                                <EmptyState />

                                <div className="text-center mt-6">
                                    <button
                                        onClick={() =>
                                            router.push("/")
                                        }
                                        className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 font-semibold transition"
                                    >
                                        Start your first scan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {records
                                    .slice(0, 10)
                                    .map((record) => (
                                        <div
                                            key={record.id}
                                            className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold">
                                                    ♻
                                                </div>

                                                <div>
                                                    <p className="font-bold capitalize">
                                                        {record.material ||
                                                            record.ai_category ||
                                                            "Unknown"}
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(
                                                            record.created_at
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs">
                                                        Confidence
                                                    </p>

                                                    <p className="font-semibold">
                                                        {Number(
                                                            record.ai_confidence ??
                                                            0
                                                        ).toFixed(1)}
                                                        %
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-gray-500 text-xs">
                                                        Category
                                                    </p>

                                                    <p className="font-semibold capitalize">
                                                        {record.final_category ||
                                                            "Pending"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </AuthGuard>
    );
}

function StatCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="text-3xl font-black mt-2">
                {value}
            </p>

            <p className="text-xs text-gray-600 mt-2">
                {description}
            </p>
        </div>
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-950 border border-gray-800">
            <span className="text-sm text-gray-500">
                {label}
            </span>

            <span className="font-bold">
                {value}
            </span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center text-2xl mb-4">
                ♻
            </div>

            <p className="font-semibold text-gray-300">
                No scan data yet
            </p>

            <p className="text-sm text-gray-600 mt-2">
                Your waste analytics will appear here
                after your first scan.
            </p>
        </div>
    );
}