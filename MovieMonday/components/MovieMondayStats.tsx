"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Utensils, Wine, Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import CountUp from "react-countup"; // You'll need to install this package

interface Stats {
  totalMovieMondays: number;
  totalMealsShared: number;
  totalCocktailsConsumed: number;
}

const MovieMondayStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/movie-monday/stats",
        );

        if (response.ok) {
          const data = await response.json();

          setStats(data);
        } else {
          // Fallback stats if API fails
          setStats({
            totalMovieMondays: 246,
            totalMealsShared: 517,
            totalCocktailsConsumed: 829,
          });
        }
      } catch (error) {
        console.error("Error fetching MovieMonday stats:", error);
        // Fallback stats if API fails
        setStats({
          totalMovieMondays: 246,
          totalMealsShared: 517,
          totalCocktailsConsumed: 829,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Determine styles based on theme
  const cardBg = theme === "light" ? "bg-white" : "bg-gray-800";
  const textColor = theme === "light" ? "text-gray-800" : "text-white";
  const subTextColor = theme === "light" ? "text-gray-600" : "text-gray-300";
  const iconColor = theme === "light" ? "text-primary-600" : "text-primary-400";
  const sectionBg = theme === "light" ? "bg-gray-50" : "bg-gray-900";

  return (
    <section className={`py-16 ${sectionBg}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold mb-3 ${textColor}`}>
            Join Our Growing Community
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${subTextColor}`}>
            See how Movie Monday has been bringing friends together
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <Card className={`shadow-md ${cardBg}`}>
              <CardBody className="p-6 text-center">
                <div
                  className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4 bg-primary-100 ${theme === "light" ? "bg-primary-50" : "bg-primary-900"}`}
                >
                  <Calendar className={`h-8 w-8 ${iconColor}`} />
                </div>
                <h3 className={`text-4xl font-bold mb-2 ${textColor}`}>
                  <CountUp
                    duration={2.5}
                    end={stats?.totalMovieMondays || 0}
                    separator=","
                  />
                </h3>
                <p className={`text-lg ${subTextColor}`}>
                  Movie Mondays Hosted
                </p>
              </CardBody>
            </Card>

            {/* Stat Card 2 */}
            <Card className={`shadow-md ${cardBg}`}>
              <CardBody className="p-6 text-center">
                <div
                  className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4 ${theme === "light" ? "bg-primary-50" : "bg-primary-900"}`}
                >
                  <Utensils className={`h-8 w-8 ${iconColor}`} />
                </div>
                <h3 className={`text-4xl font-bold mb-2 ${textColor}`}>
                  <CountUp
                    duration={2.5}
                    end={stats?.totalMealsShared || 0}
                    separator=","
                  />
                </h3>
                <p className={`text-lg ${subTextColor}`}>Meals Shared</p>
              </CardBody>
            </Card>

            {/* Stat Card 3 */}
            <Card className={`shadow-md ${cardBg}`}>
              <CardBody className="p-6 text-center">
                <div
                  className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4 ${theme === "light" ? "bg-primary-50" : "bg-primary-900"}`}
                >
                  <Wine className={`h-8 w-8 ${iconColor}`} />
                </div>
                <h3 className={`text-4xl font-bold mb-2 ${textColor}`}>
                  <CountUp
                    duration={2.5}
                    end={stats?.totalCocktailsConsumed || 0}
                    separator=","
                  />
                </h3>
                <p className={`text-lg ${subTextColor}`}>Cocktails Mixed</p>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default MovieMondayStats;
