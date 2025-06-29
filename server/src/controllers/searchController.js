import prisma from "../config/prisma.js";

export const searchAll = async (req, res, next) => {
    try {
        const { query, type = "all", page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (!query || query.trim().length < 2) {
            const error = new Error("Search query must be at least 2 characters long");
            error.statusCode = 400;
            return next(error);
        }

        const searchTerm = query.trim();
        const results = {};

        // Search users/creators
        if (type === "all" || type === "users") {
            const users = await prisma.user.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { username: { contains: searchTerm, mode: "insensitive" } },
                                { fullName: { contains: searchTerm, mode: "insensitive" } },
                                { bio: { contains: searchTerm, mode: "insensitive" } },
                            ],
                        },
                        { isActive: true },
                    ],
                },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    bio: true,
                    avatarUrl: true,
                    profile: {
                        select: {
                            isVerified: true,
                            monthlyPrice: true,
                        },
                    },
                    _count: {
                        select: {
                            posts: true,
                            subscribers: true,
                        },
                    },
                }, skip: type === "users" ? skip : 0,
                take: type === "users" ? parseInt(limit) : 5,
                orderBy: [
                    { profile: { isVerified: "desc" } },
                    { createdAt: "desc" },
                ],
            });

            results.users = users;
        }

        // Search posts
        if (type === "all" || type === "posts") {
            const where = {
                AND: [
                    {
                        OR: [
                            { title: { contains: searchTerm, mode: "insensitive" } },
                            { content: { contains: searchTerm, mode: "insensitive" } },
                        ],
                    },
                    { isArchived: false },
                ],
            };

            // If user is not authenticated or searching for specific creator, only show public posts
            if (!req.user) {
                where.isPremium = false;
            }

            const posts = await prisma.post.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                            profile: {
                                select: {
                                    isVerified: true,
                                },
                            },
                        },
                    },
                    categories: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                skip: type === "posts" ? skip : 0,
                take: type === "posts" ? parseInt(limit) : 5,
                orderBy: [
                    { createdAt: "desc" },
                ],
            });

            results.posts = posts;
        }

        // Search categories
        if (type === "all" || type === "categories") {
            const categories = await prisma.category.findMany({
                where: {
                    name: { contains: searchTerm, mode: "insensitive" },
                },
                include: {
                    _count: {
                        select: {
                            creators: true,
                            posts: true,
                        },
                    },
                },
                skip: type === "categories" ? skip : 0,
                take: type === "categories" ? parseInt(limit) : 5,
                orderBy: { name: "asc" },
            });

            results.categories = categories;
        }

        // Get total counts for pagination
        if (type !== "all") {
            let totalCount = 0;

            if (type === "users") {
                totalCount = await prisma.user.count({
                    where: {
                        AND: [
                            {
                                OR: [
                                    { username: { contains: searchTerm, mode: "insensitive" } },
                                    { fullName: { contains: searchTerm, mode: "insensitive" } },
                                    { bio: { contains: searchTerm, mode: "insensitive" } },
                                ],
                            },
                            { isActive: true },
                        ],
                    },
                });
            } else if (type === "posts") {
                const where = {
                    AND: [
                        {
                            OR: [
                                { title: { contains: searchTerm, mode: "insensitive" } },
                                { content: { contains: searchTerm, mode: "insensitive" } },
                            ],
                        },
                        { isArchived: false },
                    ],
                };

                if (!req.user) {
                    where.isPremium = false;
                }

                totalCount = await prisma.post.count({ where });
            } else if (type === "categories") {
                totalCount = await prisma.category.count({
                    where: {
                        name: { contains: searchTerm, mode: "insensitive" },
                    },
                });
            }

            results.pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            };
        }

        res.status(200).json({
            success: true,
            data: results,
            query: searchTerm,
            type,
        });
    } catch (error) {
        next(error);
    }
};

export const searchUsers = async (req, res, next) => {
    try {
        req.query.type = "users";
        return searchAll(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const searchPosts = async (req, res, next) => {
    try {
        req.query.type = "posts";
        return searchAll(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const searchCategories = async (req, res, next) => {
    try {
        req.query.type = "categories";
        return searchAll(req, res, next);
    } catch (error) {
        next(error);
    }
};

export const getTrendingSearches = async (req, res, next) => {
    try {
        // Get trending users (most new subscribers in last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const trendingUsers = await prisma.user.findMany({
            where: {
                isActive: true,
                profile: {
                    isVerified: true,
                },
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                profile: {
                    select: {
                        isVerified: true,
                        monthlyPrice: true,
                    },
                },
                _count: {
                    select: {
                        subscribers: true,
                    },
                },
            }, take: 10,
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get trending posts (most liked in last 7 days)
        const trendingPosts = await prisma.post.findMany({
            where: {
                isArchived: false,
                isPremium: false,
                createdAt: {
                    gte: weekAgo,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        profile: {
                            select: {
                                isVerified: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
            take: 10,
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get popular categories
        const popularCategories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        creators: true,
                        posts: true,
                    },
                },
            },
            take: 10,
            orderBy: {
                name: "asc",
            },
        });

        res.status(200).json({
            success: true,
            data: {
                trendingUsers,
                trendingPosts,
                popularCategories,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getSearchSuggestions = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 1) {
            return res.status(200).json({
                success: true,
                data: {
                    users: [],
                    categories: [],
                },
            });
        }

        const searchTerm = query.trim();

        // Get user suggestions
        const userSuggestions = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { username: { contains: searchTerm, mode: "insensitive" } },
                            { fullName: { contains: searchTerm, mode: "insensitive" } },
                        ],
                    },
                    { isActive: true },
                ],
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                profile: {
                    select: {
                        isVerified: true,
                    },
                },
            },
            take: 5,
            orderBy: [
                { profile: { isVerified: "desc" } },
                { username: "asc" },
            ],
        });

        // Get category suggestions
        const categorySuggestions = await prisma.category.findMany({
            where: {
                name: { contains: searchTerm, mode: "insensitive" },
            },
            take: 5,
            orderBy: { name: "asc" },
        });

        res.status(200).json({
            success: true,
            data: {
                users: userSuggestions,
                categories: categorySuggestions,
            },
        });
    } catch (error) {
        next(error);
    }
};
