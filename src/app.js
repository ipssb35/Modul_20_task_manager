import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/style.css";
import taskFieldTemplate from "./templates/taskField.html";
import noAccessTemplate from "./templates/noAccess.html";
import { User } from "./models/User";
import { generateTestUser } from "./utils";
import { State } from "./state";
import { authUser } from "./services/auth";

/* ============================================================ */

export const appState = new State();
let login, isAdmin, storageKey;

document.querySelector(".body").innerHTML = noAccessTemplate;
document.querySelector('.input').focus();

/* генерация юзера */
generateTestUser(User);

/* форма авторизации */
let loginForm = document.querySelector("#app-login-form");
loginForm.addEventListener("submit", loginFormSubmit);

/* ============================================================ */

/* функция авторизации */
function loginFormSubmit(e) {
    e.preventDefault();

    /* данные из формы */
    const formData = new FormData(loginForm);
    login = formData.get("login");
    const password = formData.get("password");

    /* вычисляем юзера / админа */
    const usersStorage = JSON.parse(localStorage.getItem('users'));
    const adminsStorage = JSON.parse(localStorage.getItem('admins'));
    let users = usersStorage.concat(adminsStorage);

    users.forEach(card => {
        if (card.login === login && card.password === password) {
            storageKey = card.storageKey;
        }
    });

    /* для дальнейшей проверки на юзера / админа */
    if (storageKey === 'admins') isAdmin = true;
    else isAdmin = false;

    /* авторизация */
    authUser(login, password, storageKey)
        ? document.querySelector(".body").innerHTML = taskFieldTemplate
        : authError();

    document.querySelector('.header__userName').textContent = `hello, ${login}`;

    const date = new Date()
    const board = `kanban board by ${login}, ${date.getFullYear()}`;
    document.querySelector('.footerBoard p').textContent = board;

    /* load localStorage card */
    loadUserCard();

    /* ищем элементы на созданной kanban board */
    const linkMenu = document.querySelector('.link__menu');
    const dropAccount = document.querySelector('.dropAccount');
    const dropLogout = document.querySelector('.dropLogout');
    const btnAddBacklog = document.querySelector('.btnAddBacklog');
    const btnAddReady = document.querySelector('.btnAddReady');
    const btnAddProgress = document.querySelector('.btnAddProgress');
    const btnAddFinished = document.querySelector('.btnAddFinished');

    /* вешаем на них обработчики событий */
    linkMenu.addEventListener('click', linkMenuHide);
    dropAccount.addEventListener('click', (e) => e.preventDefault());
    dropLogout.addEventListener('click', linkMenuLogout);
    btnAddBacklog.addEventListener('click', addBacklogInput);
    btnAddReady.addEventListener('click', addReady);
    btnAddProgress.addEventListener('click', addProgress);
    btnAddFinished.addEventListener('click', addFinished);

    return login, isAdmin, storageKey;
}

/* ошибка авторизации */
function authError() {
    alert('Sorry, you\'ve no access to this resource!');
    document.querySelector('.input').focus();
    throw 'auth error';
}

/* открытие/закрытие drop меню и смена стрелочки */
function linkMenuHide(e) {
    e.preventDefault();

    /* --dropHide делает меню видимым/невидимым */
    document.querySelector('.imgDropDown').classList.toggle('--dropHide');
    document.querySelector('.imgDropUp').classList.toggle('--dropHide');
    document.querySelector('.dropHideMenu').classList.toggle('--dropHide');
}

/* logout */
function linkMenuLogout(e) {
    e.preventDefault();

    /* загружаем страницу авторизации */
    document.querySelector(".body").innerHTML = noAccessTemplate;
    document.querySelector('.input').focus();

    /* вешаем новый обработчик auth user */
    loginForm = document.querySelector("#app-login-form");
    loginForm.addEventListener("submit", loginFormSubmit);
}

/* ============================================================ */

/* функция проверки открытых dropdown */
function delDropDown() {
    /* если dropdown уже создан, удаляем */
    if (document.querySelector('.select'))
        document.querySelector('.select').remove();

    if (document.querySelector('.delUsersDiv'))
        document.querySelector('.delUsersDiv').style.display = 'none';
}

/* кнопки удаления и редактирования */
function itemHover(div) {
    /* добавляем кнопки edit и del для item:hover */
    let cardEdit = document.createElement('div');
    cardEdit.classList = 'itemEdit';
    cardEdit.textContent = 'edit';
    div.append(cardEdit);

    let cardDel = document.createElement('div');
    cardDel.classList = 'itemDelete';
    cardDel.textContent = 'del';
    div.append(cardDel);

    /* вешаем на них обработчики событий */
    cardDel.addEventListener('click', delUserCard);
    cardEdit.addEventListener('click', editUserCard);
}

/* load localStorage card */ 
function loadUserCard() {
    /* сообщение о создании / удалении юзера */
    function addMessage(info) {
        if (document.querySelector('.message')) 
        document.querySelector('.message').remove();

        /* сообщение о создании юзера */
        let message = document.createElement('p');
        message.classList = 'message';
        if (info) message.textContent = info;
        document.querySelector('.createUser').append(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    /* добавления юзера */
    if (isAdmin) {
        let createUserDiv = document.querySelector('.createUser');
        createUserDiv.style.display = 'flex';
        let addUserBtn = document.querySelector('.addUserBtn');

        /* remove input & password */
        function removeInput() {
            const userInputLogin = document.querySelector('.userInputLogin');
            const userInputPassword = document.querySelector('.userInputPassword');
            const createUserBtn = document.querySelector('.createUserBtn');

            if (userInputLogin) userInputLogin.remove();
            if (userInputPassword) userInputPassword.remove();
            if (createUserBtn) createUserBtn.remove();

            document.querySelector('.delUserBtn').style.display = 'block';
            document.querySelector('.addUserBtn').style.display = 'block';
        }

        /* add input & password */
        addUserBtn.addEventListener('click', () => {
            addMessage();
            /* remove input & password */
            removeInput();

            if (document.querySelector('.delUsersDiv'))
                document.querySelector('.delUsersDiv').style.display = 'none';

            /* create button */
            let createUserBtn = document.createElement('button');
            createUserBtn.classList = 'createUserBtn';
            createUserBtn.textContent = 'create';
            addUserBtn.after(createUserBtn);
            addUserBtn.style.display = 'none';
            document.querySelector('.delUserBtn').style.display = 'none';

            /* input login */
            let userInputLogin = document.createElement('input');
            userInputLogin.classList = 'userInputLogin';
            userInputLogin.placeholder = 'login';
            createUserBtn.after(userInputLogin);
            userInputLogin.focus();

            /* input password */
            let userInputPassword = document.createElement('input');
            userInputPassword.classList = 'userInputPassword';
            userInputPassword.placeholder = 'password';
            userInputLogin.after(userInputPassword);

            createUserBtn.addEventListener('click', addUser);
        });

        /* create user */
        function addUser() {
            let userInputLogin = document.querySelector('.userInputLogin');
            let userInputPassword = document.querySelector('.userInputPassword');

            if (userInputLogin.value.trim() && userInputPassword.value.trim()) {
                /* проверка существования юзера */
                let user = false;

                const usersStorage = JSON.parse(localStorage.getItem('users'));
                usersStorage.forEach(item => {
                    if (item.login === userInputLogin.value) user = true;
                });

                const adminsStorage = JSON.parse(localStorage.getItem('admins'));
                adminsStorage.forEach(item => {
                    if (item.login === userInputLogin.value) user = true;
                });

                /* добавление юзера в localStorage */
                if (user) {
                    /* remove input & password */
                    removeInput();
                    /* сообщение о создании юзера */
                    addMessage('user already exists!');
                    return;
                }

                const newUser = new User(
                    userInputLogin.value,
                    userInputPassword.value,
                    'users'
                );
                User.save(newUser);

                /* remove input & password */
                removeInput();
                /* сообщение о создании юзера */
                addMessage('user created success!');
            } else {
                /* сообщение о создании юзера */
                addMessage('user was not created!');
                /* remove input & password */
                removeInput();
            }
        }
    }

    /* удаление юзера */
    if(isAdmin) {
        let delUserBtn = document.querySelector('.delUserBtn');
        let delUsersDiv = document.querySelector('.delUsersDiv');

        /* добавляем dropdown с users */
        delUserBtn.addEventListener('click', () => {
            delUsersDiv.style.display = 'block';
            document.querySelectorAll('.delItem').forEach(item => item.remove());

            /* перебор юзеров */
            const usersStorage = JSON.parse(localStorage.getItem('users'));
            if (!usersStorage || usersStorage.length === 0) delUsersDiv.style.display = 'none';

            usersStorage.forEach(item => {
                /* вывод юзеров */
                let delItem = document.createElement('div');
                delItem.classList = 'delItem';
                delItem.textContent = item.login;
                delUsersDiv.append(delItem);

                /* удаление юзера */
                delItem.addEventListener('click', (e) => {
                    let newStorage = [];
                    usersStorage.map(item => {
                        if (item.login === e.target.textContent) return;
                        newStorage.push(item);
                    });

                    localStorage.setItem('users', JSON.stringify(newStorage));
                    delUsersDiv.style.display = 'none';

                    /* сообщение об удалении юзера */
                    addMessage('user deleted success!');
                });
            });
        });
    }

    /* проверка на существование записей */
    const isCard = arr => arr && arr.length > 0;
    const usersStorage = JSON.parse(localStorage.getItem('users'));

    /* добавление card item */
    const addCard = (card, button, user) => {
        let itemDiv = document.createElement('div');
        itemDiv.classList = 'item';
        itemDiv.textContent = card;
        document.querySelector(`.${button}`).before(itemDiv);

        /* если юзер админ, показываем чьи таски */
        if (isAdmin) {
            let userNameDiv = document.createElement('div');
            userNameDiv.classList = 'userName';
            userNameDiv.textContent = `user: ${user}`;
            itemDiv.before(userNameDiv);
        }

        /* добавляем кнопки edit и del для item:hover */
        itemHover(itemDiv);

        /* ============================================================ */

        /* drag'n'drop */
        itemDiv.addEventListener('mousedown', itemMouseDown);

        function itemMouseDown(e) {
            let itemCard, itemLogin;
            let thisCard = e.target.firstChild.textContent;

            /* если клик правой кнопкой мыши */
            if (e.which !== 1) return;

            /* если нажата кнопка удаления / редактирования */
            if (e.target.classList.contains('itemEdit')) return;
            if (e.target.classList.contains('itemDelete')) return;

            /* запоминаем размеры переносимого элемента */
            let width = itemDiv.offsetWidth;
            let height = itemDiv.offsetHeight;

            let coords = getCoords(itemDiv);
            let shiftX = e.pageX - coords.left;
            let shiftY = e.pageY - coords.top;
        
            /* размещаем на том же месте, но в абсолютных координатах */
            itemDiv.style.position = 'absolute';
            moveAt(e);
        
            /* переместим в body, чтобы item был точно не внутри position:relative */
            document.body.append(itemDiv);
            itemDiv.style.zIndex = 999;
            
            function moveAt(e) {
                itemDiv.style.width = width + 'px';
                itemDiv.style.height = height + 'px';
                itemDiv.style.left = e.pageX - shiftX + 'px';
                itemDiv.style.top = e.pageY - shiftY + 'px';
                
                /* границы переносимого элемента */
                let header = document.querySelector('.header__wrapper');
                let footer = document.querySelector('.footer__wrapper');

                let scrollHeight = Math.max(
                    document.body.scrollHeight, document.documentElement.scrollHeight,
                    document.body.offsetHeight, document.documentElement.offsetHeight,
                    document.body.clientHeight, document.documentElement.clientHeight
                );

                if (itemDiv.offsetTop < header.offsetHeight) itemDiv.style.top = header.offsetHeight + 'px';
                if (itemDiv.offsetLeft < 0) itemDiv.style.left = 0;
                if (itemDiv.offsetLeft > document.body.clientWidth - itemDiv.offsetWidth)
                    itemDiv.style.left = document.body.clientWidth - itemDiv.offsetWidth + 'px';
                if (itemDiv.offsetTop > scrollHeight - itemDiv.offsetHeight - footer.offsetHeight)
                    itemDiv.style.top = scrollHeight - itemDiv.offsetHeight - footer.offsetHeight + 'px';

                /* текущий card блок */
                usersStorage.forEach(item => {
                    if (item.backlog && item.backlog.indexOf(thisCard) !== -1) {
                        itemCard = 'backlog';
                        itemLogin = item.login;
                    }
                    if (item.ready && item.ready.indexOf(thisCard) !== -1) {
                        itemCard = 'ready';
                        itemLogin = item.login;
                    }
                    if (item.progress && item.progress.indexOf(thisCard) !== -1) {
                        itemCard = 'progress';
                        itemLogin = item.login;
                    }
                });

                /* подсвечиваем блоки для переноса */
                if (itemCard === 'backlog') {
                    document.querySelector('.cardReady').style.background = '#0067A3';
                    document.querySelector('.cardReady p').style.color = '#fff';
                }

                if (itemCard === 'ready') {
                    document.querySelector('.cardProgress').style.background = '#0067A3';
                    document.querySelector('.cardProgress p').style.color = '#fff';
                }

                if (itemCard === 'progress') {
                    document.querySelector('.cardFinished').style.background = '#0067A3';
                    document.querySelector('.cardFinished p').style.color = '#fff';
                }
            }
        
            /* перемещаем по экрану */
            document.onmousemove = (e) => moveAt(e);
        
            /* отслеживаем окончание переноса */
            itemDiv.onmouseup = (e) => {
                let itemClass;

                document.onmousemove = null;
                itemDiv.onmouseup = null;

                /* прячем элемент */
                itemDiv.hidden = true;

                /* определяем что под элементом */
                let elem = document.elementsFromPoint(e.clientX, e.clientY);
                elem.forEach(el => {
                    if (el.className === 'cardItem cardReady') itemClass = 'ready';
                    if (el.className === 'cardItem cardProgress') itemClass = 'progress';
                    if (el.className === 'cardItem cardFinished') itemClass = 'finished';
                });

                usersStorage.map(item => {
                    if (!isAdmin && item.login !== login) return;
                    else if (item.login !== itemLogin) return;

                    /* в ready */
                    if (itemCard === 'backlog' && itemClass === 'ready') {
                        /* добавляем в ready */
                        let arrItem = item.ready || [];
                        arrItem.push(thisCard);
                        item.ready = arrItem;

                        /* удаляем из backlog */
                        const index = item.backlog.indexOf(thisCard);
                        item.backlog.splice(index, 1);
                    }

                    /* в progress */
                    if (itemCard === 'ready' && itemClass === 'progress') {
                        /* добавляем в progress */
                        let arrItem = item.progress || [];
                        arrItem.push(thisCard);
                        item.progress = arrItem;

                        /* удаляем из ready */
                        const index = item.ready.indexOf(thisCard);
                        item.ready.splice(index, 1);
                    }

                    /* в finished */
                    if (itemCard === 'progress' && itemClass === 'finished') {
                        /* добавляем в finished */
                        let arrItem = item.finished || [];
                        arrItem.push(thisCard);
                        item.finished = arrItem;

                        /* удаляем из progress */
                        const index = item.progress.indexOf(thisCard);
                        item.progress.splice(index, 1);
                    }
                });
                localStorage.setItem('users', JSON.stringify(usersStorage));

                /* обновляем card */
                loadUserCard();

                /* обнуляем цвета блоков */
                document.querySelector('.cardReady').style.background = '#EBECF0';
                document.querySelector('.cardReady p').style.color = '#000';
                document.querySelector('.cardProgress').style.background = '#EBECF0';
                document.querySelector('.cardProgress p').style.color = '#000';
                document.querySelector('.cardFinished').style.background = '#EBECF0';
                document.querySelector('.cardFinished p').style.color = '#000';
            }
        
            function getCoords(elem) { 
                let box = elem.getBoundingClientRect();
                return {
                    top: box.top + pageYOffset,
                    left: box.left + pageXOffset
                };
            }
        }

        /* ============================================================ */       
    }

    /* button disabled true */
    const ButtonDisabledTrue = button => {
        document.querySelector(`.${button}`).disabled = true;
        document.querySelector(`.${button}`).classList.add('--disable');
    }

    /* button disabled false */
    const ButtonDisabledFalse = button => {
        document.querySelector(`.${button}`).disabled = false;
        document.querySelector(`.${button}`).classList.remove('--disable');
    }

    /* обновление cards */
    document.querySelectorAll('.item').forEach(item => item.remove());
    document.querySelectorAll('.userName').forEach(item => item.remove());

    /* если админ, объединяем все массивы task для вывода */
    if (isAdmin) {
        let backlog = [];
        let ready = [];
        let progress = [];
        let finished = [];

        usersStorage.forEach(card => {
            if (isCard(card.backlog)) card.backlog.forEach(item => backlog.push([item, card.login]));
            if (isCard(card.ready)) card.ready.forEach(item => ready.push([item, card.login]));
            if (isCard(card.progress)) card.progress.forEach(item => progress.push([item, card.login]));
            if (isCard(card.finished)) card.finished.forEach(item => finished.push([item, card.login]));
        });

        /* выводим данные из localStorage для админа */
        function outputCardSelect(arr, ofBtn, inBtn) {
            if (isCard(arr)) {
                arr.forEach(item => {
                    let [text, userLogin] = [item[0], item[1]];
                    addCard(text, ofBtn, userLogin);
                    if (inBtn) ButtonDisabledFalse(inBtn);
                });
            } else if (inBtn) ButtonDisabledTrue(inBtn);
        }

        outputCardSelect(backlog, 'btnAddBacklog', 'btnAddReady');
        outputCardSelect(ready, 'btnAddReady', 'btnAddProgress');
        outputCardSelect(progress, 'btnAddProgress', 'btnAddFinished');
        outputCardSelect(finished, 'btnAddFinished');
    } else {
        /* выводим данные из localStorage залогиненного юзера */
        usersStorage.map(card => {
            if (card.login !== login) return;

            /* добавляем card для каждого task */
            if (isCard(card.backlog)) {
                card.backlog.forEach(item => addCard(item, 'btnAddBacklog', card.login));
                ButtonDisabledFalse('btnAddReady');
            } else ButtonDisabledTrue('btnAddReady');

            if (isCard(card.ready)) {
                card.ready.forEach(item => addCard(item, 'btnAddReady', card.login));
                ButtonDisabledFalse('btnAddProgress');
            } else ButtonDisabledTrue('btnAddProgress');

            if (isCard(card.progress)) {
                card.progress.forEach(item => addCard(item, 'btnAddProgress', card.login));
                ButtonDisabledFalse('btnAddFinished');
            } else ButtonDisabledTrue('btnAddFinished');

            if (isCard(card.finished)) {
                card.finished.forEach(item => addCard(item, 'btnAddFinished', card.login));
            }
        });
    }

    /* если админ, удаляем кнопку добавления таска */
    if (isAdmin) {
        document.querySelector('.btnAddBacklog').disabled = true;
        document.querySelector('.btnAddBacklog').classList.add('--disable');
    }

    /* обновляем количество tasks в footer */
    let activeTasks = 0, finishedTasks = 0, footer;
    
    usersStorage.forEach(card => {
        if (isAdmin) {
            if (card.backlog && card.backlog.length > 0) activeTasks += card.backlog.length;
            if (card.finished && card.finished.length > 0) finishedTasks += card.finished.length;
        } else {
            if (card.login !== login) return;

            if (card.backlog && card.backlog.length > 0) activeTasks = card.backlog.length;
            if (card.finished && card.finished.length > 0) finishedTasks = card.finished.length;
        }        

        activeTasks = activeTasks ? activeTasks : 0;
        finishedTasks = finishedTasks ? finishedTasks : 0;
    });

    footer = `active tasks: ${activeTasks}, finished tasks: ${finishedTasks}`;
    document.querySelector('.footerTasks p').textContent = footer;
}

/* add backlog */
function addBacklogInput() {
    delDropDown();

    /* вставляем input для ввода add card */
    let cardInput = document.createElement('input');
    cardInput.classList = 'input';
    document.querySelector('.btnAddBacklog').before(cardInput);
    cardInput.focus();

    /* создаем кнопку добавления input */
    let cardSubmit = document.createElement('button');
    cardSubmit.classList = 'button';
    cardSubmit.textContent = 'save';
    document.querySelector('.btnAddBacklog').before(cardSubmit);

    /* прячем add card */
    document.querySelector('.btnAddBacklog').style.display = 'none';

    /* обработчик добавления card на расфокусировку input */
    cardInput.addEventListener('blur', () => {
        let inputValue = cardInput.value.trim();

        /* если input пустой, не добавляем card */
        if (inputValue === '' || isAdmin) {
            /* удаляем input и submit и возвращаем кнопку add card */
            cardInput.remove();
            cardSubmit.remove();
            document.querySelector('.btnAddBacklog').style.display = 'block';
            return;
        };

        /* обновляем localStorage залогиненного юзера */
        let usersStorage = JSON.parse(localStorage.getItem('users'));
        usersStorage.map((item) => {
            if (item.login === login) {
                let arrItem = item.backlog || [];
                arrItem.push(inputValue);
                item.backlog = arrItem;
            }
        });
        localStorage.setItem('users', JSON.stringify(usersStorage));

        /* удаляем input и submit и возвращаем кнопку add card */
        cardInput.remove();
        cardSubmit.remove();
        document.querySelector('.btnAddBacklog').style.display = 'block';

        /* обновляем card */
        loadUserCard();
    });
}

/* функция удаления card */
function delUserCard(e) {
    /* удаляем открытый dropdown */
    delDropDown();

    /* текущий card */
    const text = e.target.parentNode.firstChild.textContent;
    let itemIndex;

    const delItemIndex = (arr) => {
        if (arr && arr.length > 0) {
            arr.map(item => {
                if (item === text) {
                    itemIndex = arr.indexOf(text);
                    arr.splice(itemIndex, 1);
                }
            });
        }
    }

    /* обновляем localStorage */
    const usersStorage = JSON.parse(localStorage.getItem('users'));
    usersStorage.map(card => {
        /* удаляем текущий card */
        delItemIndex(card.backlog);
        delItemIndex(card.ready);
        delItemIndex(card.progress);
        delItemIndex(card.finished);
    });
    localStorage.setItem('users', JSON.stringify(usersStorage));

    /* обновляем card */
    loadUserCard();
}

/* функция редактирования card */
function editUserCard(e) {
    delDropDown();

    /* текущий card */
    let text = e.target.parentNode.firstChild.textContent;

    /* вставляем input для редактирования */
    let cardInput = document.createElement('input');
    cardInput.classList = 'input';
    cardInput.value = text;
    e.target.parentNode.before(cardInput);
    e.target.parentNode.remove();
    cardInput.focus();

    /* создаем кнопку редактирования input */
    let cardEdit = document.createElement('button');
    cardEdit.classList = 'button';
    cardEdit.textContent = 'edit';

    /* функция вставки input */
    const isIndex = (arr, btnClass) => {
        if (!arr || arr.length === 0) return;

        if (arr.indexOf(text) >= 0) {
            document.querySelector(`.${btnClass}`).before(cardEdit);
            document.querySelector(`.${btnClass}`).style.display = 'none';
        }
    }

    /* обновляем localStorage */
    const usersStorage = JSON.parse(localStorage.getItem('users'));
    usersStorage.map(item => {
        /* вставляем input в соответствующем блоке */
        isIndex(item.backlog, 'btnAddBacklog');
        isIndex(item.ready, 'btnAddReady');
        isIndex(item.progress, 'btnAddProgress');
        isIndex(item.finished, 'btnAddFinished');
    });

    /* обработчик редактирования card на расфокусировку input */
    cardInput.addEventListener('blur', () => {
        let itemIndex;

        let editItemIndex = (arr) => {
            if (arr && arr.length > 0) {
                arr.map(item => {
                    if (item === text) {
                        itemIndex = arr.indexOf(item);
                        let inputValue = cardInput.value.trim();
                        if (inputValue === '') arr.splice(itemIndex, 1);
                        else arr.splice(itemIndex, 1, inputValue);
                    }
                });
            }
        }

        /* обновляем localStorage залогиненного юзера */
        let usersStorage = JSON.parse(localStorage.getItem('users'));
        usersStorage.map((card) => {
            editItemIndex(card.backlog);
            editItemIndex(card.ready);
            editItemIndex(card.progress);
            editItemIndex(card.finished);
        });
        localStorage.setItem('users', JSON.stringify(usersStorage));

        /* удаляем input и edit button */
        cardInput.remove();
        cardEdit.remove();

        document.querySelector(`.btnAddBacklog`).style.display = 'block';
        document.querySelector(`.btnAddReady`).style.display = 'block';
        document.querySelector(`.btnAddProgress`).style.display = 'block';
        document.querySelector(`.btnAddFinished`).style.display = 'block';

        /* обновляем card */
        loadUserCard();
    });
}

/* ============================================================ */

/* add ready */
function addReady() {
    delDropDown();

    /* добавляем dropdown с backlog тасками */
    let selectDiv = document.createElement('div');
    selectDiv.classList = 'select';
    selectDiv.textContent = 'tasks backlog:';
    document.querySelector('.btnAddReady').before(selectDiv);

    let selectUl = document.createElement('ul');
    selectDiv.append(selectUl);

    /* функция добавления backlog таска */
    function addCardLi(text) {
        let selectLi = document.createElement('li');
        selectLi.classList = 'liTask';
        selectLi.textContent = text;
        selectUl.append(selectLi);
        
        /* добавление backlog в ready */
        selectLi.addEventListener('click', (e) => {
            let usersStorage = JSON.parse(localStorage.getItem('users'));

            /* обновляем localStorage под админом */
            if (isAdmin) {
                let itemLogin;

                usersStorage.forEach(item => {
                    if (!item.backlog || item.backlog === 0) return;

                    item.backlog.forEach(card => {
                        if (card !== e.target.textContent) return;
                        itemLogin = item.login;
                    });
                });

                usersStorage.map(item => {
                    if (item.login !== itemLogin) return;
    
                    /* добавляем в ready */
                    let arrItem = item.ready || [];
                    arrItem.push(text);
                    item.ready = arrItem;
    
                    /* удаляем из backlog */
                    const index = item.backlog.indexOf(e.target.textContent);
                    item.backlog.splice(index, 1);
                });
            }

            /* обновляем localStorage залогиненного юзера */
            usersStorage.map(item => {
                if (item.login !== login) return;

                /* добавляем в ready */
                let arrItem = item.ready || [];
                arrItem.push(text);
                item.ready = arrItem;

                /* удаляем из backlog */
                const index = item.backlog.indexOf(text);
                item.backlog.splice(index, 1);
            });
            localStorage.setItem('users', JSON.stringify(usersStorage));

            /* обновляем card */
            loadUserCard();

            /* удаляем dropdown */
            delDropDown();
        });
    }

    /* выводим данные из localStorage залогиненного юзера */
    let usersStorage = JSON.parse(localStorage.getItem('users'));
    usersStorage.map((item) => {
        /* показывать юзеру */
        if (!isAdmin) {
            if (item.login !== login) return;
            if (!item.backlog || item.backlog.length === 0) return;
            item.backlog.forEach(card => addCardLi(card));
        /* показывать админу */
        } else {
            if (!item.backlog || item.backlog.length === 0) return;
            item.backlog.forEach(card => addCardLi(card));
        }
    });
}

/* add progress */
function addProgress() {
    delDropDown();

    /* добавляем dropdown с progress тасками */
    let selectDiv = document.createElement('div');
    selectDiv.classList = 'select';
    selectDiv.textContent = 'tasks progress:';
    document.querySelector('.btnAddProgress').before(selectDiv);

    let selectUl = document.createElement('ul');
    selectDiv.append(selectUl);

    /* функция добавления progress таска */
    function addCardLi(text) {
        let selectLi = document.createElement('li');
        selectLi.classList = 'liTask';
        selectLi.textContent = text;
        selectUl.append(selectLi);
        
        /* добавление ready в progress */
        selectLi.addEventListener('click', (e) => {
            let usersStorage = JSON.parse(localStorage.getItem('users'));

            /* обновляем localStorage под админом */
            if (isAdmin) {
                let itemLogin;

                usersStorage.forEach(item => {
                    if (!item.ready || item.ready === 0) return;

                    item.ready.forEach(card => {
                        if (card !== e.target.textContent) return;
                        itemLogin = item.login;
                    });
                });

                usersStorage.map(item => {
                    if (item.login !== itemLogin) return;
    
                    /* добавляем в progress */
                    let arrItem = item.progress || [];
                    arrItem.push(text);
                    item.progress = arrItem;
    
                    /* удаляем из ready */
                    const index = item.ready.indexOf(e.target.textContent);
                    item.ready.splice(index, 1);
                });
            }

            /* обновляем localStorage залогиненного юзера */
            usersStorage.map(item => {
                if (item.login !== login) return;

                /* добавляем в progress */
                let arrItem = item.progress || [];
                arrItem.push(text);
                item.progress = arrItem;

                /* удаляем из ready */
                const index = item.ready.indexOf(text);
                item.ready.splice(index, 1);
            });
            localStorage.setItem('users', JSON.stringify(usersStorage));

            /* обновляем card */
            loadUserCard();

            /* удаляем dropdown */
            delDropDown();
        });
    }

    /* выводим данные из localStorage залогиненного юзера */
    let usersStorage = JSON.parse(localStorage.getItem('users'));
    usersStorage.map((item) => {
        /* показывать юзеру */
        if (!isAdmin) {
            if (item.login !== login) return;
            if (!item.ready || item.ready.length === 0) return;
            item.ready.forEach(card => addCardLi(card));
        /* показывать админу */
        } else {
            if (!item.ready || item.ready.length === 0) return;
            item.ready.forEach(card => addCardLi(card));
        }
    });
}

/* add finished */
function addFinished() {
    delDropDown();

    /* добавляем dropdown с finished тасками */
    let selectDiv = document.createElement('div');
    selectDiv.classList = 'select';
    selectDiv.textContent = 'tasks finished:';
    document.querySelector('.btnAddFinished').before(selectDiv);

    let selectUl = document.createElement('ul');
    selectDiv.append(selectUl);

    /* функция добавления finished таска */
    function addCardLi(text) {
        let selectLi = document.createElement('li');
        selectLi.classList = 'liTask';
        selectLi.textContent = text;
        selectUl.append(selectLi);
        
        /* добавление progress в finished */
        selectLi.addEventListener('click', (e) => {
            let usersStorage = JSON.parse(localStorage.getItem('users'));

            /* обновляем localStorage под админом */
            if (isAdmin) {
                let itemLogin;

                usersStorage.forEach(item => {
                    if (!item.progress || item.progress === 0) return;

                    item.progress.forEach(card => {
                        if (card !== e.target.textContent) return;
                        itemLogin = item.login;
                    });
                });

                usersStorage.map(item => {
                    if (item.login !== itemLogin) return;
    
                    /* добавляем в progress */
                    let arrItem = item.finished || [];
                    arrItem.push(text);
                    item.finished = arrItem;
    
                    /* удаляем из ready */
                    const index = item.progress.indexOf(e.target.textContent);
                    item.progress.splice(index, 1);
                });
            }

            /* обновляем localStorage залогиненного юзера */
            usersStorage.map(item => {
                if (item.login !== login) return;

                /* добавляем в progress */
                let arrItem = item.finished || [];
                arrItem.push(text);
                item.finished = arrItem;

                /* удаляем из ready */
                const index = item.progress.indexOf(text);
                item.progress.splice(index, 1);
            });
            localStorage.setItem('users', JSON.stringify(usersStorage));

            /* обновляем card */
            loadUserCard();

            /* удаляем dropdown */
            delDropDown();
        });
    }

    /* выводим данные из localStorage залогиненного юзера */
    let usersStorage = JSON.parse(localStorage.getItem('users'));
    usersStorage.map((item) => {
        /* показывать юзеру */
        if (!isAdmin) {
            if (item.login !== login) return;
            if (!item.progress || item.progress.length === 0) return;
            item.progress.forEach(card => addCardLi(card));
        /* показывать админу */
        } else {
            if (!item.progress || item.progress.length === 0) return;
            item.progress.forEach(card => addCardLi(card));
        }
    });
}
