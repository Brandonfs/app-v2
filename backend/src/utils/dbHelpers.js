const extractInsertId = (insertResult) => {
  if (Array.isArray(insertResult)) {
    const first = insertResult[0];
    if (first && typeof first === 'object') {
      return first.id;
    }
    return first;
  }

  if (insertResult && typeof insertResult === 'object' && 'id' in insertResult) {
    return insertResult.id;
  }

  return insertResult;
};

module.exports = { extractInsertId };
