var serviceDuration = 30, // константа длительность услуги (чтобы проставить время окончания при открытии окна
    timeInt = 15; // интервал времени, используюшийся для выбора времени услуги

var app = angular.module('app', []);

// Директива временной шкалы, для вызова окна записи клиента
app.directive('timefield', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {},
        link: function (scope, iElement, iAttrs) {
            // Инициализация массива временных интервалов, начальное и конечное время берется из аттрибутов директивы
            var start = getTimeFromString(iAttrs.timeStart),
                end = getTimeFromString(iAttrs.timeEnd);
            end.setMinutes(end.getMinutes() - timeInt);

            scope.timearr = getTimeArr(start, end);
            scope.$parent.timearr = scope.timearr;

            //Функция открытия окна по клику на шкалу, проставляет начальное и конечное время
            scope.addRecord = function (index) {
                scope.$parent.showPopup = true;
                scope.$parent.startTime = index;
                scope.$parent.endTime = index + (serviceDuration / timeInt - 1);
            };
            scope.getTimeString = scope.$parent.getTimeString;
        },
        templateUrl: 'templates/timefield.html',
        replace: true
    }
});

// Директива кастомного попапа, для отображения выпадающих списков с иконками
app.directive('customselect', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            class: "@",
            data: "=selectData"

        },
        require: '?ngModel',
        link: function (scope, iElement, iAttrs, ngModel) {

            // Отслеживаем изменения данных, если директива не привязана к ngModel
            // или текущий элемент не содержится в наборе данных - устанавливаем текущим первый из набора
            scope.$watch('data', function (val) {
                var cond = ngModel && ngModel.$modelValue;
                if (!cond || (cond && !findItemById(ngModel.$modelValue, val)))
                    scope.curItem = val && val[0] && val[0];

            });
            // Обновляем ngModel, если изменился текущий элемент
            scope.$watch('curItem', function (val) {
                if (ngModel && val)
                    ngModel.$setViewValue(val.id);
            });

            // При изменении ngModel устанавливаем соответствующий текущий элемент
            scope.$watch(function () {
                    return ngModel && ngModel.$modelValue;
                },
                function (val) {
                    if (!scope.data) return;
                    scope.curItem = findItemById(val, scope.data);

                });
        },
        templateUrl: 'templates/customselect.html',
        replace: true
    }
});

// Контроллер
app.controller('cntrl', ['$scope', '$http', function ($scope, $http) {
    // Функция возвращает отформатированную строку времени из объекта Date
    $scope.getTimeString = getTimeString;

    // Обработчик клика на кнопку "Создать нового клиента". Парсист строку из поиска клиента на фамилию и имя,
    // заполняет соответствующие переменные и переключает на вкладку добавления клиента
    $scope.toClient = function () {
        var arr = $scope.findClient.split(' ');
        $scope.clientName = arr[0];
        $scope.clientSurname = arr[1];
        $scope.client = true;
    };

    //Получаем список категорий для соответствующего попапа
    $http.get('queries/categories').success(function (data) {
        $scope.categories = data;
    });

    // Отслеживаем текущую выбранную категорию для получения списков соответствующих ей сервисов и мастеров
    $scope.$watch('curCat', function (val) {
        if (!val) return;
        $http.get('queries/services_cat' + val).success(function (data) {
            $scope.services = data;
        });
        $http.get('queries/masters_cat' + val).success(function (data) {
            $scope.masters = data;
        });
    });

    // Отслеживаем массив временных интервалов для инициализации набора данных для попапа времени начала
    $scope.$watch('timearr', function (val) {
        if (!val) return;
        $scope.startTimes = makeTimesObj(0, val);
        var arr = val;
        // Отслеживаем время начала для инициализации набора данных для попапа времени конца
        $scope.$watch('startTime', function (val) {
            $scope.endTimes = makeTimesObj(val, arr, true);
        });
    });

    // Отслеживаем поиск клиента для проверки в базе
    $scope.$watch('findClient', function (val) {
        if (!val || !val.length)
            $scope.isAddClient = false;
        else
            $scope.isAddClient = !checkClientName(val); // Здесь должен быть ajax запрос к серверу для проверки
        /*
         checkClientName(val).success(function(res){
            $scope.isAddClient = res;
         });*/

    });
}]);


function getTimeFromString(str) {
    var timeArr = str.split(':'),
        res = new Date();
    res.setHours(timeArr[0], timeArr[1]);
    return res;
}

function getTimeArr(start, end) {
    var timearr = [];
    for (var i = new Date(start); i <= end; i.setMinutes(i.getMinutes() + timeInt)) {
        timearr.push(new Date(i));
    }
    return timearr;
}
function makeTimesObj(start, arr, isend) {
    var res = [];
    for (var i = start; i < arr.length; i++) {
        var time = arr[i];
        if (isend) {
            time = new Date(time);
            time.setMinutes(time.getMinutes() + timeInt);
        }
        res.push({'id': i, "text": getTimeString(time)});
    }
    return res;
};
function getTimeString(dateObj) {
    if (!dateObj) return;
    var mnts = dateObj.getMinutes();
    return dateObj.getHours() + ':' + (mnts || '00');
};

function findItemById(id, items) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].id == id) {
            return items[i];
        }
    }
};

function checkClientName(name) {
    return false;
};

