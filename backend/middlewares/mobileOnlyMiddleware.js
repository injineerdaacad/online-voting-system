

export const mobileOnly = (req, res, next) => {
  const clientType = req.headers['x-client-type'] || req.headers['X-Client-Type'];

  if (clientType !== 'mobile') {
    return res.status(403).json({
      error: 'This endpoint is only accessible from mobile applications',
      message: 'Student login is restricted to mobile clients only',
    });
  }

  next();
};