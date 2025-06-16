"use client";
import React from "react";

import ComingSoonPage from "@/components/ui/ComingSoonPage";

export default function AboutPage() {
  return (
    <div>
      <ComingSoonPage />
    </div>
    // <div className="container mx-auto px-4 py-12">
    //   {/* Hero Section */}
    //   <div className="flex flex-col md:flex-row items-center gap-8 mb-20">
    //     <div className="md:w-1/2">
    //       <h1 className="text-4xl md:text-5xl font-bold mb-6">About Movie Monday</h1>
    //       <p className="text-lg text-default-600 mb-6">
    //       Turn your Mondays into a celebration of connection with Movie Monday! Gather your friends for a night of movies, cocktails, homemade dinners, and sweet desserts. It’s more than just a movie night—it’s about building community, creating memories, and making Mondays something to look forward to. Let the laughter, conversation, and great food roll as you share an unforgettable weekly tradition.
    //       </p>
    //     </div>
    //     <div className="md:w-1/2">
    //       <Image
    //         src="https://placehold.co/600x400?text=Movie+Monday+Gathering"
    //         alt="Friends enjoying Movie Monday"
    //         className="rounded-lg shadow-lg w-full"
    //         fallbackSrc=""
    //       />
    //     </div>
    //   </div>

    //   {/* Our Mission Section */}
    //   <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-20">
    //     <div className="md:w-1/2">
    //       <h2 className="text-3xl font-bold mb-6">Our Mission: Making Mondays Magical</h2>
    //       <p className="text-lg text-default-600 mb-4">
    //         We believe that Mondays don't have to be mundane. By creating a weekly ritual centered around cinema, cuisine, and community, we've transformed the beginning of the workweek into a celebration that everyone anticipates.
    //       </p>
    //       <p className="text-lg text-default-600">
    //         Our mission is simple: create an environment where friends can escape the Monday blues, expand their film horizons, and strengthen bonds over shared experiences. It's not just about watching movies—it's about creating memories.
    //       </p>
    //     </div>
    //     <div className="md:w-1/2">
    //       <Image
    //         alt="Cozy Movie Monday setup"
    //         className="rounded-lg shadow-lg w-full"
    //         src="https://placehold.co/600x400?text=Cozy+Movie+Setup"
    //       />
    //     </div>
    //   </div>

    //   {/* Our Story Section */}
    //   <div className="mb-20">
    //     <h2 className="text-3xl font-bold mb-6">Our Story</h2>
    //     <div className="flex flex-col md:flex-row gap-8">
    //       <div className="md:w-1/2">
    //         <Image
    //           alt="The first Movie Monday"
    //           className="rounded-lg shadow-lg w-full"
    //           src="https://placehold.co/600x400?text=Movie+Monday+Origins"
    //         />
    //       </div>
    //       <div className="md:w-1/2 space-y-4">
    //         <p className="text-default-600">
    //           Movie Monday began in 2018 when a group of friends, tired of dreading the start of each week, decided to reclaim Mondays with something to look forward to. What started as a casual gathering with a laptop and takeout has evolved into an elaborate weekly tradition.
    //         </p>
    //         <p className="text-default-600">
    //           Each week, a different member selects three potential films, and the group votes on which to watch. The host prepares themed food and cocktails to complement the chosen film, creating an immersive experience that goes beyond just watching a movie.
    //         </p>
    //         <p className="text-default-600">
    //           As the tradition grew, so did our appreciation for film, culinary creativity, and most importantly, the value of regular connection. Now, years later, our founding members have spread across different cities, but Movie Monday continues to thrive in multiple locations, with new friends joining the tradition.
    //         </p>
    //       </div>
    //     </div>
    //   </div>

    //   {/* Movie Monday By the Numbers */}
    //   <div className="mb-20">
    //     <h2 className="text-3xl font-bold text-center mb-12">Movie Monday By the Numbers</h2>
    //     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    //       <Card className="text-center hover:shadow-lg transition-shadow">
    //         <CardBody className="flex flex-col items-center p-6">
    //           <Calendar className="w-16 h-16 text-primary mb-4" />
    //           <h3 className="text-2xl font-bold mb-2">246+</h3>
    //           <p className="text-lg font-semibold">Movie Mondays Hosted</p>
    //           <p className="text-default-500 mt-2">Since our first gathering in 2018</p>
    //           <Link href="#" className="text-primary mt-4 inline-flex items-center">
    //             See the timeline <ArrowRight className="ml-1 w-4 h-4" />
    //           </Link>
    //         </CardBody>
    //       </Card>

    //       <Card className="text-center hover:shadow-lg transition-shadow">
    //         <CardBody className="flex flex-col items-center p-6">
    //           <Film className="w-16 h-16 text-primary mb-4" />
    //           <h3 className="text-2xl font-bold mb-2">738+</h3>
    //           <p className="text-lg font-semibold">Films Watched</p>
    //           <p className="text-default-500 mt-2">Across every genre imaginable</p>
    //           <Link href="#" className="text-primary mt-4 inline-flex items-center">
    //             Browse our collection <ArrowRight className="ml-1 w-4 h-4" />
    //           </Link>
    //         </CardBody>
    //       </Card>

    //       <Card className="text-center hover:shadow-lg transition-shadow">
    //         <CardBody className="flex flex-col items-center p-6">
    //           <Users className="w-16 h-16 text-primary mb-4" />
    //           <h3 className="text-2xl font-bold mb-2">40+</h3>
    //           <p className="text-lg font-semibold">Regular Participants</p>
    //           <p className="text-default-500 mt-2">Building friendships through cinema</p>
    //           <Link href="#" className="text-primary mt-4 inline-flex items-center">
    //             Meet our community <ArrowRight className="ml-1 w-4 h-4" />
    //           </Link>
    //         </CardBody>
    //       </Card>
    //     </div>
    //   </div>

    //   {/* Testimonials */}
    //   <div className="mb-20">
    //     <h2 className="text-3xl font-bold text-center mb-12">What Our Members Say</h2>
    //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    //       <Card className="hover:shadow-lg transition-shadow">
    //         <CardBody className="p-6">
    //           <div className="flex flex-col h-full">
    //             <p className="text-default-600 italic mb-6">
    //               "Movie Monday has completely transformed how I view the start of the week. Instead of Sunday scaries, I get Sunday excitement for what movie and food awaits us the next day!"
    //             </p>
    //             <div className="mt-auto flex items-center">
    //               <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
    //                 <span className="font-bold text-primary">SA</span>
    //               </div>
    //               <div>
    //                 <h4 className="font-semibold">Sarah A.</h4>
    //                 <p className="text-default-500 text-sm">Member since 2019</p>
    //               </div>
    //             </div>
    //           </div>
    //         </CardBody>
    //       </Card>

    //       <Card className="hover:shadow-lg transition-shadow">
    //         <CardBody className="p-6">
    //           <div className="flex flex-col h-full">
    //             <p className="text-default-600 italic mb-6">
    //               "I've discovered so many amazing films I would have never chosen on my own. The discussions after each viewing have deepened my appreciation for cinema and for my friends' perspectives."
    //             </p>
    //             <div className="mt-auto flex items-center">
    //               <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
    //                 <span className="font-bold text-primary">MJ</span>
    //               </div>
    //               <div>
    //                 <h4 className="font-semibold">Michael J.</h4>
    //                 <p className="text-default-500 text-sm">Member since 2020</p>
    //               </div>
    //             </div>
    //           </div>
    //         </CardBody>
    //       </Card>

    //       <Card className="hover:shadow-lg transition-shadow">
    //         <CardBody className="p-6">
    //           <div className="flex flex-col h-full">
    //             <p className="text-default-600 italic mb-6">
    //               "The themed cocktails and meals have inspired me to get more creative in the kitchen. Movie Monday has become a highlight of my week and a chance to show off my culinary experiments!"
    //             </p>
    //             <div className="mt-auto flex items-center">
    //               <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
    //                 <span className="font-bold text-primary">LT</span>
    //               </div>
    //               <div>
    //                 <h4 className="font-semibold">Luis T.</h4>
    //                 <p className="text-default-500 text-sm">Member since 2021</p>
    //               </div>
    //             </div>
    //           </div>
    //         </CardBody>
    //       </Card>
    //     </div>
    //   </div>

    //   {/* Awards Section */}
    //   <div className="mb-20">
    //     <h2 className="text-3xl font-bold text-center mb-12">Recognition & Milestones</h2>
    //     <div className="flex flex-wrap justify-center gap-8">
    //       <div className="flex flex-col items-center">
    //         <Award className="w-12 h-12 text-warning mb-2" />
    //         <p className="font-semibold text-center">Best Community<br/>Tradition</p>
    //         <p className="text-sm text-default-500 text-center">Local Culture<br/>Magazine 2022</p>
    //       </div>

    //       <div className="flex flex-col items-center">
    //         <Heart className="w-12 h-12 text-danger mb-2" />
    //         <p className="font-semibold text-center">Most Consistent<br/>Friend Group</p>
    //         <p className="text-sm text-default-500 text-center">Friendship<br/>Awards 2023</p>
    //       </div>

    //       <div className="flex flex-col items-center">
    //         <Film className="w-12 h-12 text-primary mb-2" />
    //         <p className="font-semibold text-center">100th Movie<br/>Milestone</p>
    //         <p className="text-sm text-default-500 text-center">Celebrated<br/>August 2021</p>
    //       </div>

    //       <div className="flex flex-col items-center">
    //         <Calendar className="w-12 h-12 text-success mb-2" />
    //         <p className="font-semibold text-center">5 Year<br/>Anniversary</p>
    //         <p className="text-sm text-default-500 text-center">Celebrated<br/>January 2023</p>
    //       </div>
    //     </div>
    //   </div>

    //   {/* Join the Tradition CTA */}
    //   <div className="bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-8 text-center">
    //     <h2 className="text-3xl font-bold mb-4">Start Your Own Movie Monday</h2>
    //     <p className="text-lg text-default-600 max-w-2xl mx-auto mb-6">
    //       Ready to transform your Mondays? Create your own Movie Monday tradition with friends or join our community to connect with other film enthusiasts.
    //     </p>
    //     <div className="flex flex-wrap justify-center gap-4">
    //       <Button color="primary" size="lg">
    //         Create Account
    //       </Button>
    //       <Button variant="bordered" color="secondary" size="lg">
    //         Learn How It Works
    //       </Button>
    //     </div>
    //   </div>
    // </div>
  );
}
