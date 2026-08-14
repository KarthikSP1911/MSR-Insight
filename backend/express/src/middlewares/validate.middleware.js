/**
 * Validates and replaces req[part] with the parsed (and type-coerced) result
 * of the zod schema. Mirrors the { success, message } error shape used
 * elsewhere in the API.
 */
const validate = (schema, part = "body") => (req, res, next) => {
  const result = schema.safeParse(req[part]);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".") || part}: ${issue.message}`)
      .join("; ");

    return res.status(400).json({
      success: false,
      message,
    });
  }

  req[part] = result.data;
  next();
};

export default validate;
