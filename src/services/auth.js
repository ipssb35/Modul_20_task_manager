import { appState } from "../app";
import { User } from "../models/User";

export const authUser = function (login, password, storageKey) {
    const user = new User(login, password, storageKey);
    if (!user.hasAccess) return false;
    appState.currentUser = user;
    return true;
};
