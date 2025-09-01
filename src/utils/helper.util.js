import mongoose from "mongoose";
import { SORT_TYPES } from "../constants.js";

export const getSortOrder = (sortType) => {
  switch (sortType?.toLowerCase()) {
    case SORT_TYPES.ASCENDING:
      return 1;

    case SORT_TYPES.DECENDING:
      return -1;
  }
};

/**
 * @description check if the given id is valid mongoose id
 * @param {string | number | mongoose.mongo.BSON.ObjectId | mongoose.mongo.BSON.ObjectIdLike | Uint8Array<ArrayBufferLike>} id
 * @returns {Boolean}
 */
export const checkValidMongooseId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
