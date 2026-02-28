
import { Award, HeartHandshake, Wrench, Eye, Lightbulb, UserPlus, Shield, Star, Trophy } from "lucide-react";
import React from "react";

export const allBadges: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
}[] = [
    {
        id: 'reporter-1',
        title: 'New Reporter',
        description: 'Submit your first valid issue report.',
        icon: <Award className="h-8 w-8" />,
    },
    {
        id: 'reporter-10',
        title: 'Dedicated Reporter',
        description: 'Submit 10 valid issue reports.',
        icon: <Star className="h-8 w-8" />,
    },
    {
        id: 'reporter-50',
        title: 'Veteran Reporter',
        description: 'Submit 50 valid issue reports.',
        icon: <Shield className="h-8 w-8" />,
    },
    {
        id: 'reporter-100',
        title: 'Elite Reporter',
        description: 'Submit 100 valid issue reports.',
        icon: <Trophy className="h-8 w-8" />,
    },
    {
        id: 'team-player',
        title: 'Team Player',
        description: 'Join 5 reports submitted by others.',
        icon: <UserPlus className="h-8 w-8" />,
    },
    {
        id: 'pothole-pro',
        title: 'Pothole Pro',
        description: 'Report 3 separate pothole issues.',
        icon: <Wrench className="h-8 w-8" />,
    },
    {
        id: 'sharp-eye',
        title: 'Sharp Eye',
        description: 'Report an issue with a severity score of 8+.',
        icon: <Eye className="h-8 w-8" />,
    },
    {
        id: 'street-guardian',
        title: 'Street Guardian',
        description: 'Report 5 broken streetlights.',
        icon: <Lightbulb className="h-8 w-8" />,
    },
];
