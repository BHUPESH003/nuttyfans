import prisma from "../config/prisma.js";

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      const error = new Error("Name is required");
      error.statusCode = 400;
      return next(error);
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      const error = new Error("Category already exists");
      error.statusCode = 400;
      return next(error);
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      const error = new Error("Name is required");
      error.statusCode = 400;
      return next(error);
    }

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: {
          not: id,
        },
      },
    });

    if (existingCategory) {
      const error = new Error("Category name already in use");
      error.statusCode = 400;
      return next(error);
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    const creatorsUsingCategory = await prisma.creatorProfile.count({
      where: {
        categories: {
          some: {
            id,
          },
        },
      },
    });

    const postsUsingCategory = await prisma.post.count({
      where: {
        categories: {
          some: {
            id,
          },
        },
      },
    });

    if (creatorsUsingCategory > 0 || postsUsingCategory > 0) {
      const error = new Error(
        "Cannot delete category because it is being used by creators or posts"
      );
      error.statusCode = 400;
      return next(error);
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
