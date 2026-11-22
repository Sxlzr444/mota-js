main.floors.MT7=
{
    "floorId": "MT7",
    "title": "主塔 7 层",
    "name": "7",
    "width": 13,
    "height": 13,
    "canFlyTo": true,
    "canFlyFrom": true,
    "canUseQuickShop": true,
    "cannotViewMap": false,
    "images": [],
    "ratio": 1,
    "defaultGround": "grass2",
    "firstArrive": [],
    "eachArrive": [],
    "parallelDo": "",
    "events": {},
    "changeFloor": {
        "6,12": {
            "floorId": "MT6",
            "loc": [
                6,
                0
            ]
        },
        "12,11": {
            "floorId": "MT8",
            "loc": [
                0,
                11
            ]
        }
    },
    "beforeBattle": {},
    "afterBattle": {},
    "afterGetItem": {},
    "afterOpenDoor": {},
    "autoEvent": {
        "2,4": {
            "0": {
                "condition": "!(core.enemyExists(1,3)||core.enemyExists(3,3))",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        },
        "2,7": {
            "0": {
                "condition": "!(core.enemyExists(1,6)||core.enemyExists(3,6))",
                "currentFloor": true,
                "priority": 0,
                "delayExecute": false,
                "multiExecute": false,
                "data": [
                    {
                        "type": "openDoor"
                    }
                ]
            }
        }
    },
    "cannotMove": {},
    "cannotMoveIn": {},
    "map": [
    [ 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    [ 20,  0, 31,20007, 20,  0,  0,345,  0, 81,  0, 31, 20],
    [ 20,20006,  0,  0, 81,  0, 20,  0, 20, 20,  0,  0, 20],
    [ 20,201,  0,201, 20,  0, 20,  0,205,  0,  0, 20, 20],
    [ 20, 20, 85, 20, 20,  0, 20,20010,  0, 20,205,  0, 20],
    [ 20,  0,  0,  0, 20,  0, 20, 20, 20, 20,  0,  0, 20],
    [ 20,343,  0,343,20038,  0, 21,  0,40010, 20, 81, 20, 20],
    [ 20, 20, 85, 20, 20,  0,  0,  0,  0, 20, 32,152,152],
    [ 20,  0,  0,  0, 20,201, 20, 20,  0,152,  0, 27,152],
    [ 20, 31,  0, 71, 20,  0,  0, 20,  0,152,152, 81,152],
    [ 20, 81, 20, 20, 20, 20,  0, 20,344,  0,  0,  0,152],
    [ 20,  0,  0,  0, 82,202,  0, 20,152, 21,  0,244, 94],
    [ 20, 20, 20, 20, 20, 20, 93,152,152,152,152,152,152]
],
    "bgmap": [

],
    "fgmap": [

]
}