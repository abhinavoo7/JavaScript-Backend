import { SORT_TYPES } from "../constants.js";

export const getSortOrder = (sortType) => {
  switch (sortType?.toLowerCase()) {
    case SORT_TYPES.ASCENDING:
      return 1;

    case SORT_TYPES.DECENDING:
      return -1;
  }
};
