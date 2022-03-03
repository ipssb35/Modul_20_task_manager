export const getFromStorage = function (key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
};
  
export const addToStorage = function (obj, key) {
    const storageData = getFromStorage(key);
    storageData.push(obj);
    localStorage.setItem(key, JSON.stringify(storageData));
};

export const generateTestUser = function (User) {
    localStorage.clear();

    const testUser = new User('test', 'qwerty', 'users');
    User.save(testUser);

    const testAdmin = new User('admin', 'admin', 'admins');
    User.save(testAdmin);
};
