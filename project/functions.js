///<reference path='../runtime.d.ts'/>
			/**
			 * 穿刺削减比例函数，按穿刺比例削减防御，结果最小为0。
			 * @param {number} a 被削减的数值
			 * @param {number} b 穿刺比例，0~1
			 */
			let perReduce = (a, b) => {
				let value = a * (1 - b);
				if (!(value>0)) value = 0;
				value = Math.floor(value);
				return value;								
			};
			/**
			 * 非负减法函数，结果小于0时返回0。
			 * @param {number} a 被减数
			 * @param {number} b 减数
			 */
			let minusP = (a, b) => {
				let value = a - b;
				if (!(value>0)) value = 0;
				value = Math.floor(value);
				return value;
			};

			/**
			 * 目标数如果大于0则取0
			 * @param {number} a 原来的数
			 * @param {boolean} needFlooring 是否需要取整，不填则不取整
			 */
			let noNeg = (a,needFlooring) => {
				if (!(a>0)) return 0;
				if (needFlooring) a = Math.floor(a);
				return a;
			}
var tools = {perReduce,minusP,noNeg};

var functions_d6ad677b_427a_4623_b50f_a445a3b0ef8a =
{				
	"events": {

		"resetGame": function (hero, hard, floorId, maps, values) {
			// 重置整个游戏；此函数将在游戏开始时，或者每次读档时最先被调用
			// hero：勇士信息；hard：难度；floorId：当前楼层ID；maps：地图信息；values：全局数值信息

			// 清除游戏数据
			// 这一步会清空状态栏和全部画布内容，并删除所有动态创建的画布
			core.clearStatus();
			// 初始化status
			core.status = core.clone(core.initStatus, function (name) {
				return name != 'hero' && name != 'maps';
			});
			core.control._bindRoutePush();
			core.status.played = true;
			// 初始化人物，图标，统计信息
			core.status.hero = core.clone(hero);
			window.hero = core.status.hero;
			window.flags = core.status.hero.flags;
			core.events.setHeroIcon(core.status.hero.image, true);
			core.control._initStatistics(core.animateFrame.totalTime);
			core.status.hero.statistics.totalTime = core.animateFrame.totalTime =
				Math.max(core.status.hero.statistics.totalTime, core.animateFrame.totalTime);
			core.status.hero.statistics.start = null;
			// 初始难度
			core.status.hard = hard || "";
			// 初始化地图
			core.status.floorId = floorId;
			core.status.maps = maps;
			core.maps._resetFloorImages();
			// 初始化怪物和道具
			core.material.enemys = core.enemys.getEnemys();
			core.material.items = core.items.getItems();
			// 初始化全局数值和全局开关
			core.values = core.clone(core.data.values);
			for (var key in values || {})
				core.values[key] = values[key];
			core.flags = core.clone(core.data.flags);
			var globalFlags = core.getFlag("globalFlags", {});
			for (var key in globalFlags)
				core.flags[key] = globalFlags[key];
			core._init_sys_flags();
			// 初始化界面，状态栏等
			core.resize();
			// 状态栏是否显示
			if (core.hasFlag('hideStatusBar'))
				core.hideStatusBar(core.hasFlag('showToolbox'));
			else
				core.showStatusBar();
			// 隐藏右下角的音乐按钮
			core.dom.musicBtn.style.display = 'none';
		},
		"win": function (reason, norank, noexit) {
			// 游戏获胜事件
			// 请注意，成绩统计时是按照hp进行上传并排名
			// 可以先在这里对最终分数进行计算，比如将2倍攻击和5倍黄钥匙数量加到分数上
			// core.status.hero.hp += 2 * core.getRealStatus('atk') + 5 * core.itemCount('yellowKey');

			// 如果不退出，则临时存储数据
			if (noexit) {
				core.status.extraEvent = core.clone(core.status.event);
			}

			// 游戏获胜事件 
			core.ui.closePanel();
			var replaying = core.isReplaying();
			if (replaying) core.stopReplay();
			core.waitHeroToStop(function () {
				if (!noexit) {
					core.clearMap('all'); // 清空全地图
					core.deleteAllCanvas(); // 删除所有创建的画布
					core.dom.gif2.innerHTML = "";
				}
				reason = core.replaceText(reason);
				core.drawText([
					"\t[" + (reason || "恭喜通关") + "]你的分数是${status:hp}。"
				], function () {
					core.events.gameOver(reason || '', replaying, norank);
				})
			});
		},
		"lose": function (reason) {
			// 游戏失败事件
			core.ui.closePanel();
			var replaying = core.isReplaying();
			core.stopReplay();
			core.waitHeroToStop(function () {
				core.drawText([
					"\t[" + (reason || "结局1") + "]你死了。\n如题。"
				], function () {
					core.events.gameOver(null, replaying);
				});
			})
		},
		"changingFloor": function (floorId, heroLoc) {
			// 正在切换楼层过程中执行的操作；此函数的执行时间是“屏幕完全变黑“的那一刻
			// floorId为要切换到的楼层ID；heroLoc表示勇士切换到的位置

			// ---------- 此时还没有进行切换，当前floorId还是原来的 ---------- //
			var currentId = core.status.floorId || null; // 获得当前的floorId，可能为null
			var fromLoad = core.hasFlag('__fromLoad__'); // 是否是读档造成的切换
			var isFlying = core.hasFlag('__isFlying__'); // 是否是楼传造成的切换
			if (!fromLoad && !(isFlying && currentId == floorId)) {
				if (!core.hasFlag("__leaveLoc__")) core.setFlag("__leaveLoc__", {});
				if (currentId != null) core.getFlag("__leaveLoc__")[currentId] = core.clone(core.status.hero.loc);
			}

			// 可以对currentId进行判定，比如删除某些自定义图层等
			// if (currentId == 'MT0') {
			//     core.deleteAllCanvas();
			// }

			// 根据分区信息自动砍层与恢复
			if (core.autoRemoveMaps) core.autoRemoveMaps(floorId);

			// 重置画布尺寸
			core.maps.resizeMap(floorId);
			// 设置勇士的位置
			heroLoc.direction = core.turnDirection(heroLoc.direction);
			core.status.hero.loc = heroLoc;
			// 检查重生怪并重置
			if (!fromLoad) {
				core.extractBlocks(floorId);
				core.status.maps[floorId].blocks.forEach(function (block) {
					if (block.disable && core.enemys.hasSpecial(block.event.id, 23)) {
						block.disable = false;
						core.setMapBlockDisabled(floorId, block.x, block.y, false);
						core.maps._updateMapArray(floorId, block.x, block.y);
					}
				});
				core.control.gatherFollowers();
			}

			// ---------- 重绘新地图；这一步将会设置core.status.floorId ---------- //
			core.drawMap(floorId);

			// 切换楼层BGM
			if (core.status.maps[floorId].bgm) {
				var bgm = core.status.maps[floorId].bgm;
				if (bgm instanceof Array) bgm = bgm[Math.floor(Math.random() * bgm.length)]; // 多个bgm则随机播放一个
				if (!core.hasFlag("__bgm__")) core.playBgm(bgm);
			} else if (fromLoad && !core.hasFlag("__bgm__")) {
				core.pauseBgm();
			}
			// 更改画面色调
			var color = core.getFlag('__color__', null);
			if (!color && core.status.maps[floorId].color)
				color = core.status.maps[floorId].color;
			core.clearMap('curtain');
			core.status.curtainColor = color;
			if (color) core.fillRect('curtain', 0, 0, core._PX_ || core.__PIXELS__, core._PY_ || core.__PIXELS__, core.arrayToRGBA(color));
			// 更改天气
			var weather = core.getFlag('__weather__', null);
			if (!weather && core.status.maps[floorId].weather)
				weather = core.status.maps[floorId].weather;
			if (weather)
				core.setWeather(weather[0], weather[1]);
			else core.setWeather();

			// ...可以新增一些其他内容，比如创建个画布在右上角显示什么内容等等

		},
		"afterChangeFloor": function (floorId) {
			// 转换楼层结束的事件；此函数会在整个楼层切换完全结束后再执行
			// floorId是切换到的楼层

			// 如果是读档，则进行检查（是否需要恢复事件）
			if (core.hasFlag('__fromLoad__')) {
				core.events.recoverEvents(core.getFlag("__events__"));
				core.removeFlag("__events__");
			} else {
				// 每次抵达楼层执行的事件
				core.insertAction(core.floors[floorId].eachArrive);

				// 首次抵达楼层时执行的事件（后插入，先执行）
				if (!core.hasVisitedFloor(floorId)) {
					core.insertAction(core.floors[floorId].firstArrive);
					core.visitFloor(floorId);
				}
			}
		},
		"flyTo": function (toId, callback) {
			// 楼层传送器的使用，从当前楼层飞往toId
			// 如果不能飞行请返回false

			var fromId = core.status.floorId;

			// 检查能否飞行
			if (!core.status.maps[fromId].canFlyFrom || !core.status.maps[toId].canFlyTo || !core.hasVisitedFloor(toId)) {
				core.playSound('操作失败');
				core.drawTip("无法飞往" + core.status.maps[toId].title + "！", 'fly');
				return false;
			}

			// 平面塔模式
			var stair = null,
				loc = null;
			if (core.flags.flyRecordPosition) {
				loc = core.getFlag("__leaveLoc__", {})[toId] || null;
			}
			if (core.status.maps[toId].flyPoint != null && core.status.maps[toId].flyPoint.length == 2) {
				stair = 'flyPoint';
			}
			if (stair == null && loc == null) {
				// 获得两个楼层的索引，以决定是上楼梯还是下楼梯
				var fromIndex = core.floorIds.indexOf(fromId),
					toIndex = core.floorIds.indexOf(toId);
				var stair = fromIndex <= toIndex ? "downFloor" : "upFloor";
				// 地下层：同层传送至上楼梯
				if (fromIndex == toIndex && core.status.maps[fromId].underGround) stair = "upFloor";
			}

			// 记录录像
			core.status.route.push("fly:" + toId);
			// 传送
			core.ui.closePanel();
			core.setFlag('__isFlying__', true);
			core.changeFloor(toId, stair, loc, null, function () {
				core.removeFlag("__isFlying__");
				if (callback) callback();
			});

			return true;
		},
		"beforeBattle": function (enemyId, x, y) {
			// 战斗前触发的事件，可以加上一些战前特效（详见下面支援的例子）
			// 此函数在“检测能否战斗和自动存档”【之后】执行。如果需要更早的战前事件，请在插件中覆重写 core.events.doSystemEvent 函数。
			// 返回true则将继续战斗，返回false将不再战斗。

			// ------ 支援技能 ------ //
			if (x != null && y != null) {
				var index = x + "," + y,
					cache = core.status.checkBlock.cache[index] || {},
					guards = cache.guards || [];
				// 如果存在支援怪
				if (guards.length > 0) {
					// 记录flag，当前要参与支援的怪物
					core.setFlag("__guards__" + x + "_" + y, guards);
					var actions = [{ "type": "playSound", "name": "跳跃" }];
					// 增加支援的特效动画（图块跳跃）
					guards.forEach(function (g) {
						core.push(actions, { "type": "jump", "from": [g[0], g[1]], "to": [x, y], "time": 300, "keep": false, "async": true });
					});
					core.push(actions, [
						{ "type": "waitAsync" }, // 等待所有异步事件执行完毕
						{ "type": "setBlock", "number": enemyId, "loc": [[x, y]] }, // 重新设置怪物自身
						{ "type": "battle", "loc": [x, y] } // 重要！重新触发本次战斗
					]);
					core.insertAction(actions);
					return false;
				}
			}

			return true;
		},
		"afterBattle": function (enemyId, x, y) {
			// 战斗结束后触发的事件

			var enemy = core.material.enemys[enemyId];
			var special = enemy.special;

			// 播放战斗音效和动画
			// 默认播放的动画；你也可以使用
			var animate = 'hand'; // 默认动画
			// 检查当前装备是否存在攻击动画
			var equipId = core.getEquip(0);
			if (equipId && (core.material.items[equipId].equip || {}).animate)
				animate = core.material.items[equipId].equip.animate;
			// 你也可以在这里根据自己的需要，比如enemyId或special或flag来修改播放的动画效果
			// if (enemyId == '...') animate = '...';

			// 检查该动画是否存在SE，如果不存在则使用默认音效
			if (!(core.material.animates[animate] || {}).se)
				core.playSound('attack.mp3');

			// 播放动画；如果不存在坐标（强制战斗）则播放到勇士自身
			if (x != null && y != null)
				core.drawAnimate(animate, x, y);
			else
				core.drawHeroAnimate(animate);

			// 获得战斗伤害信息
			var damageInfo = core.getDamageInfo(enemyId, null, x, y) || {};

			// 伤害计算全程只操作模拟副本；只有这里（真实战斗结算）才把战后流血状态写回真实 bleed 对象。
			// 手册、临界表、能否获胜等调用会丢弃返回值中的 bleed 字段，存档不受影响。
			core.plugin.bleed.applyBattleResult(damageInfo.bleed);
			
			/**  怪物战斗后的剩余HP，用于哈气结算。  
			 * 如果怪物未拥有哈气技能或其他能够中途脱战的手段，  
			 * 又或者怪物已经被打死了，即战后hp<=0，  
			 * 那么这个monHpLeft应该为undefined。  
			*/
			let monHpLeft = damageInfo.monHpLeft;

			//console.log(monHpLeft); 
			// 战斗伤害
			var damage = damageInfo.damage;
			// 当前战斗回合数，可用于战后所需的判定
			var turn = damageInfo.turn;
			// 判定是否致死
			if (damage == null || damage >= core.status.hero.hp) {
				core.status.hero.hp = 0;
				core.updateStatusBar(false, true);
				core.events.lose('战斗失败');
				return;
			}

			// 扣减体力值并记录统计数据
			core.status.hero.hp -= damage;
			core.status.hero.statistics.battleDamage += damage;
			core.status.hero.statistics.battle++;


			/**  怪物技能——哈气，hasHissing获得怪物是否触发哈气技能，仅在拥有哈气技能且未被击杀（monHpLeft>0）且存在怪物坐标时触发*/
			let hasHissing = core.hasSpecial(special, 5001) && (monHpLeft>0) && x != null && y != null;

			// 计算当前怪物的支援怪物
			var guards = [];
			if (x != null && y != null) {
				guards = core.getFlag("__guards__" + x + "_" + y, []);
				core.removeFlag("__guards__" + x + "_" + y);
			}


			// 事件的处理
			var todo = [];

			/** 是否真正被击杀
			 * 只有没有逃跑时才会计算战后事件
			 */
			let runAway = hasHissing;

			// 获得金币
			let money = 0;
			if (!runAway){
				money = guards.reduce(function (curr, g) {
					return curr + core.material.enemys[g[2]].money;
				}, core.getEnemyValue(enemy, "money", x, y));
				if (core.hasItem('coin')) money *= 2; // 幸运金币：双倍
				if (core.hasFlag('curse')) money = 0; // 诅咒效果
				core.status.hero.money += money;
				core.status.hero.statistics.money += money;
			}

			// 获得经验
			let exp = 0;
			if (!runAway){
				exp = guards.reduce(function (curr, g) {
					return curr + core.material.enemys[g[2]].exp;
				}, core.getEnemyValue(enemy, "exp", x, y));
				if (core.hasFlag('curse')) exp = 0;
				core.status.hero.exp += exp;
				core.status.hero.statistics.exp += exp;
			}

			/** 战后左上角显示的提示信息 */
			let hint = "如果你看到这条消息说明游戏出错了";
			if (runAway){
				hint = core.getEnemyValue(enemy, "name", x, y) + "逃跑了！";
			}
			if (!runAway){
				hint = "打败 " + core.getEnemyValue(enemy, "name", x, y);
				if (core.flags.statusBarItems.indexOf('enableMoney') >= 0)
					hint += ',' + core.getStatusLabel('money') + '+' + money; // hint += "，金币+" + money;
				if (core.flags.statusBarItems.indexOf('enableExp') >= 0)
					hint += ',' + core.getStatusLabel('exp') + '+' + exp; // hint += "，经验+" + exp;
			}
			core.drawTip(hint, enemy.id);

			// 仇恨怪物将仇恨值减半
			if (core.enemys.hasSpecial(special, 17)&&!runAway) {
				core.setFlag('hatred', Math.floor(core.getFlag('hatred', 0) / 2));
			}

			// 自爆
			if (core.enemys.hasSpecial(special, 19)&&!runAway) {
				core.status.hero.statistics.battleDamage += core.status.hero.hp - 1;
				core.status.hero.hp = 1;
			}
			// 退化
			if (core.enemys.hasSpecial(special, 21)&&!runAway) {
				core.status.hero.atk -= (enemy.atkValue || 0);
				core.status.hero.def -= (enemy.defValue || 0);
				if (core.status.hero.atk < 0) core.status.hero.atk = 0;
				if (core.status.hero.def < 0) core.status.hero.def = 0;
			}

			// 增加仇恨值
			if(!runAway) core.setFlag('hatred', core.getFlag('hatred', 0) + core.values.hatred);

			// 加点事件
			if(!runAway){
				let point = guards.reduce(function (curr, g) {
					return curr + core.material.enemys[g[2]].point;
				}, core.getEnemyValue(enemy, "point", x, y)) || 0;
				if (core.flags.enableAddPoint && point > 0) {
					core.push(todo, [{ "type": "insert", "name": "加点事件", "args": [point] }]);
			}
			}
			
			// 中毒
			if (core.enemys.hasSpecial(special, 12)) {
				core.triggerDebuff('get', 'poison');
			}
			// 衰弱
			if (core.enemys.hasSpecial(special, 13)) {
				core.triggerDebuff('get', 'weak');
			}
			// 诅咒
			if (core.enemys.hasSpecial(special, 14)) {
				core.triggerDebuff('get', 'curse');
			}


			// 战后的技能处理，比如扣除魔力值
			if (core.flags.statusBarItems.indexOf('enableSkill') >= 0) {
				// 检测当前开启的技能类型
				var skill = core.getFlag('skill', 0);
				if (skill == 1) { // 技能1：二倍斩
					core.status.hero.mana -= 5; // 扣除5点魔力值
				}
				// 关闭技能
				core.setFlag('skill', 0);
				core.setFlag('skillName', '无');
			}

			// 战后事件
			if (core.status.floorId != null) {
				core.push(todo, core.floors[core.status.floorId].afterBattle[x + "," + y]);
			}
			core.push(todo, enemy.afterBattle);

			// 在这里增加其他的自定义事件需求
			/*
			if (enemyId=='xxx') {
				core.push(todo, [
					{"type": "...", ...},
				]);
			}
			*/

			// 如果事件不为空，将其插入
			if (todo.length > 0) core.insertAction(todo, x, y);

			// 因为removeBlock和hideBlock都会刷新状态栏，因此将删除部分移动到这里并保证刷新只执行一次，以提升效率
			if (core.getBlock(x, y) != null) {
				// 检查是否是重生怪物；如果是则仅隐藏不删除
				if (core.hasSpecial(enemy.special, 23)) {
					core.hideBlock(x, y);
				} else {
					core.removeBlock(x, y);
				}
			} else {
				core.updateStatusBar();
			}

			// 哈气技能的处理：寻找合法的脱战后移动目的地坐标
			let hissingSpawn = null;
			if (hasHissing) {
				let floorId = core.status.floorId;
				let directions = ['up', 'left', 'right', 'down'];
				for (let i = 0; i < directions.length; ++i) {
					let direction = directions[i];
					let offset = core.utils.scan[direction];
					let nx = x + offset.x,
						ny = y + offset.y;
					if ((nx == core.getHeroLoc('x') && ny == core.getHeroLoc('y')) ||
						core.getBlock(nx, ny, floorId, true) != null ||
						!core.canMoveHero(x, y, direction, floorId)) continue;
					hissingSpawn = [nx, ny];
					break;
				}
			}
			// 如果找到了哈气的目的地坐标
			if (hissingSpawn) {
				core.events.moveEnemyOnPoint(x, y, hissingSpawn[0], hissingSpawn[1], core.status.floorId, true);
				core.setBlock(enemyId, hissingSpawn[0], hissingSpawn[1], core.status.floorId);
				core.setEnemyOnPoint(hissingSpawn[0], hissingSpawn[1],core.status.floorId,"nextHp",monHpLeft);
				//哈气怪物拥有双生时的特殊结算：如果脱战逃跑后已经用掉了双生的复活效果，则设置该怪物不能再次使用双生复活，用 unableToRevive 属性表示。
				if (damageInfo.twinReviveUsed){
					core.setEnemyOnPoint(hissingSpawn[0], hissingSpawn[1],core.status.floorId,"unableToRevive",true);
				}
			//如果怪物触发了哈气，且没有找到哈气的目的地坐标，则怪物停留原地
			}
			else if (hasHissing) {
					core.setBlock(enemyId, x, y, core.status.floorId);
					core.setEnemyOnPoint(x, y,core.status.floorId,"nextHp",monHpLeft);
					//哈气怪物拥有双生时的特殊结算：如果脱战逃跑后已经用掉了双生的复活效果，则设置该怪物不能再次使用双生复活，用 unableToRevive 属性表示。
					if (damageInfo.twinReviveUsed){
        				core.setEnemyOnPoint(x, y, core.status.floorId, "unableToRevive", true);
					}	
				}
			else if (x != null && y != null) {
				delete ((flags.enemyOnPoint || {})[core.status.floorId] || {})[x + "," + y];
			}
			//console.log(core.getEnemyValue(enemyId,"nextHp",x,y,core.status.floorId));
			// 如果已有事件正在处理中
			if (core.status.event.id == null)
				core.continueAutomaticRoute();
			else
				core.clearContinueAutomaticRoute();

		},
		"afterOpenDoor": function (doorId, x, y) {
			// 开一个门后触发的事件

			var todo = [];
			// 检查该点的开门后事件
			if (core.status.floorId) {
				core.push(todo, core.floors[core.status.floorId].afterOpenDoor[x + "," + y]);
			}
			// 检查批量开门事件
			var door = core.getBlockById(doorId);
			if (door && door.event.doorInfo) {
				core.push(todo, door.event.doorInfo.afterOpenDoor);
			}

			if (todo.length > 0) core.insertAction(todo, x, y);

			if (core.status.event.id == null)
				core.continueAutomaticRoute();
			else
				core.clearContinueAutomaticRoute();
		},
		"afterGetItem": function (itemId, x, y, isGentleClick) {
			// 获得一个道具后触发的事件
			// itemId：获得的道具ID；x和y是该道具所在的坐标
			// isGentleClick：是否是轻按触发的
			if (itemId.endsWith('Potion') && core.material.items[itemId].cls == 'items')
				core.playSound('回血');
			else if (itemId.endsWith('Gem') && core.material.items[itemId].cls == 'items')
				core.playSound('宝石')
			else
				core.playSound('获得道具');

			var todo = [];
			// 检查该点的获得道具后事件。
			if (core.status.floorId == null) return;
			var event = core.floors[core.status.floorId].afterGetItem[x + "," + y];
			if (event && (event instanceof Array || !isGentleClick || !event.disableOnGentleClick)) {
				if (event.data) event = event.data;
				core.unshift(todo, event);
			}

			if (todo.length > 0) core.insertAction(todo, x, y);
		},
		"afterPushBox": function () {
			// 推箱子后的事件
			if (core.searchBlock('box').length == 0) {
				// 可以通过if语句来进行开门操作
				/*
				if (core.status.floorId=='xxx') { // 在某个楼层
					core.insertAction([ // 插入一条事件
						{"type": "openDoor", "loc": [x,y]} // 开门
					])
				}
				*/
			}
		}
	},
	"enemys": {
		"getSpecials": function () {
			// 获得怪物的特殊属性，每一行定义一个特殊属性。
			// 分为五项，第一项为该特殊属性的数字，第二项为特殊属性的名字，第三项为特殊属性的描述
			// 第四项为该特殊属性的颜色，可以写十六进制 #RRGGBB 或者 [r,g,b,a] 四元数组
			// 第五项为该特殊属性的标记；目前 1 代表是地图类技能（需要进行遍历全图）
			// 名字和描述可以直接写字符串，也可以写个function将怪物传进去
			return [
				[1, "先攻", "怪物首先攻击", "#ffcc33"],
				[2, "魔攻", "怪物无视角色的防御", "#bbb0ff"],
				[3, "坚固", "怪物防御不小于角色攻击-1", "#c0b088"],
				[4, "2连击", "怪物每回合攻击2次", "#ffee77"],
				[5, "3连击", "怪物每回合攻击3次", "#ffee77"],
				[6, function (enemy) { return (enemy.n || '') + "连击"; }, function (enemy) { return "怪物每回合攻击" + (enemy.n || 4) + "次"; }, "#ffee77"],
				[7, "破甲", function (enemy) { return "战斗前，怪物附加角色防御的" + Math.floor(100 * (enemy.breakArmor || core.values.breakArmor || 0)) + "%作为伤害"; }, "#88c0ff"],
				[8, "反击", function (enemy) { return "战斗时，怪物每回合附加角色攻击的" + Math.floor(100 * (enemy.counterAttack || core.values.counterAttack || 0)) + "%作为伤害，无视角色防御"; }, "#ffaa44"],
				[9, "净化", function (enemy) { return "战斗前，怪物附加角色护盾的" + (enemy.purify || core.values.purify) + "倍作为伤害"; }, "#80eed6"],
				[10, "模仿", "怪物的攻防和角色攻防相等", "#b0c0dd"],
				[11, "吸血", function (enemy) { return "战斗前，怪物首先吸取角色的" + Math.floor(100 * enemy.vampire || 0) + "%生命（约" + Math.floor((enemy.vampire || 0) * core.getStatus('hp')) + "点）作为伤害" + (enemy.add ? "，并把伤害数值加到自身生命上" : ""); }, "#dd4448"],
				[12, "中毒", "战斗后，角色陷入中毒状态，每一步损失生命" + core.values.poisonDamage + "点", "#99ee88"],
				[13, "衰弱", "战斗后，角色陷入衰弱状态，攻防暂时下降" + (core.values.weakValue >= 1 ? core.values.weakValue + "点" : parseInt(core.values.weakValue * 100) + "%"), "#f0bbcc"],
				[14, "诅咒", "战斗后，角色陷入诅咒状态，战斗无法获得金币和经验", "#bbeef0"],
				[15, "领域", function (enemy) { return "经过怪物周围" + (enemy.zoneSquare ? "九宫格" : "十字") + "范围内" + (enemy.range || 1) + "格时自动减生命" + (enemy.zone || 0) + "点"; }, "#c677dd"],
				[16, "夹击", "经过两只相同的怪物中间，角色生命值变成一半", "#bb99ee"],
				[17, "仇恨", "战斗前，怪物附加之前积累的仇恨值作为伤害；战斗后，释放一半的仇恨值。（每杀死一个怪物获得" + (core.values.hatred || 0) + "点仇恨值）", "#b0b666"],
				[18, "阻击", function (enemy) { return "经过怪物周围" + (enemy.zoneSquare ? "九宫格" : "十字") + "时自动减生命" + (enemy.repulse || 0) + "点，同时怪物后退一格"; }, "#8888e6"],
				[19, "自爆", "战斗后角色的生命值变成1", "#ff6666"],
				[20, "无敌", "角色无法打败怪物，除非拥有十字架", "#aaaaaa"],
				[21, "退化", function (enemy) { return "战斗后角色永久下降" + (enemy.atkValue || 0) + "点攻击和" + (enemy.defValue || 0) + "点防御"; }],
				[22, "固伤", function (enemy) { return "战斗前，怪物对角色造成" + (enemy.damage || 0) + "点固定伤害，未开启负伤时无视角色护盾。"; }, "#ff9977"],
				[23, "重生", "怪物被击败后，角色转换楼层则怪物将再次出现", "#a0e0ff"],
				[24, "激光", function (enemy) { return "经过怪物同行或同列时自动减生命" + (enemy.laser || 0) + "点"; }, "#dda0dd"],
				[25, "光环", function (enemy) { return (enemy.range != null ? ((enemy.haloSquare ? "该怪物九宫格" : "该怪物十字") + enemy.haloRange + "格范围内") : "同楼层所有") + "怪物生命提升" + (enemy.hpBuff || 0) + "%，攻击提升" + (enemy.atkBuff || 0) + "%，防御提升" + (enemy.defBuff || 0) + "%，" + (enemy.haloAdd ? "可叠加" : "不可叠加"); }, "#e6e099", 1],
				[26, "支援", "当周围一圈的怪物受到攻击时将上前支援，并组成小队战斗。", "#77c0b6", 1],
				[27, "捕捉", function (enemy) { return "当走到怪物周围" + (enemy.zoneSquare ? "九宫格" : "十字") + "时会强制进行战斗。"; }, "#c0ddbb"],
				[5001, "哈气",  function (enemy) { return "怪物会对经过周围的玩家造成"+(enemy.hissValue??enemy.value??0)+"点伤害。怪物每累计损失最大生命值的25%，就会脱离战斗，并尝试逃向相邻的空格；若没有空格可逃，则留在原地。";}, "#aaddff"],
				[5002, "争先", function (enemy) { return "怪物可选择每回合攻击任意次数，每额外攻击一次，所有攻击伤害降低" + (enemy.costValueForMultiStrikes || "[错误！本技能代价的点数未指定或为0]") + "点，最低为0；怪物会选择总伤害最高的攻击次数。"; }, "#ffee77"],
				[5003, "双生", "两只相同怪物在同一方格内出现。战斗时，玩家必须依次击败两只怪物，方格内未被击败的所有怪物会同时对玩家发动攻击。", "#9111aa"],
				[11001,"扣税", function (enemy) { return "经过怪物周围" + (enemy.zoneSquare ? "九宫格" : "十字") + "时需要缴纳" + (enemy.tax ?? 10) + "金币，同时怪物后退一格，如无法缴纳则你死亡。"; }, "#ffdd55"],
			];
		},
		"getEnemyInfo": function (enemy, heroData, x, y, floorId) {
			// 获得某个怪物变化后的数据；该函数将被伤害计算和怪物手册使用
			// 例如：坚固、模仿、仿攻等等
			// 
			// 参数说明：
			// enemy：该怪物信息
			// 勇士：生命、攻击、防御和护盾数据
			// x,y：该怪物的坐标（查看手册和强制战斗时为undefined）
			// floorId：该怪物所在的楼层
			// 后面三个参数主要是可以在光环等效果上可以适用（也可以按需制作部分范围光环效果）
			floorId = floorId || core.status.floorId;
			let hero = {
				hp: core.getRealStatusOrDefault(heroData, 'hp'),
				atk: core.getRealStatusOrDefault(heroData, 'atk'),
				def: core.getRealStatusOrDefault(heroData, 'def'),
				mdef: core.getRealStatusOrDefault(heroData, 'mdef')
			};
			let mon = {
				hp: core.getEnemyValue(enemy, 'hp', x, y, floorId),
				atk: core.getEnemyValue(enemy, 'atk', x, y, floorId),
				def: core.getEnemyValue(enemy, 'def', x, y, floorId),
				/** 处理哈气脱战后的剩余血量，如果没有哈气脱战效果则默认为null */
				nextHp: core.getEnemyValue(enemy, 'nextHp', x, y, floorId) ?? null,
				/** 处理哈气和双生联动效果，返回是否已经用过双生的复活效果  
				 * 如果怪物没有双生则不适用于这个处理，则默认为null  
				 */
				unableToRevive: core.getEnemyValue(enemy, 'unableToRevive', x, y, floorId) ?? null,
				special: core.getEnemyValue(enemy, 'special', x, y, floorId),
				money: core.getEnemyValue(enemy, 'money', x, y, floorId),
				exp: core.getEnemyValue(enemy, 'exp', x, y, floorId),
				point: core.getEnemyValue(enemy, 'point', x, y, floorId),
			};

			// 模仿
			if (core.hasSpecial(mon.special, 10)) {
				mon.atk = hero.atk;
				mon.def = hero.def;
			}
			// 坚固
			if (core.hasSpecial(mon.special, 3) && mon.def < hero.atk - 1) {
				mon.def = hero.atk - 1;
			}

			var guards = [];

			// 光环和支援检查
			if (!core.status.checkBlock) core.status.checkBlock = {};

			if (core.status.checkBlock.needCache) {
				// 从V2.5.4开始，对光环效果增加缓存，以解决多次重复计算的问题，从而大幅提升运行效率。
				var hp_buff = 0,
					atk_buff = 0,
					def_buff = 0;
				// 已经计算过的光环怪ID列表，用于判定叠加
				var usedEnemyIds = {};
				// 检查光环和支援的缓存
				var index = x != null && y != null ? (x + "," + y) : floorId;
				if (!core.status.checkBlock.cache) core.status.checkBlock.cache = {};
				var cache = core.status.checkBlock.cache[index];
				if (!cache) {
					// 没有该点的缓存，则遍历每个图块
					core.extractBlocks(floorId);
					core.status.maps[floorId].blocks.forEach(function (block) {
						if (!block.disable) {
							// 获得该图块的ID
							var id = block.event.id,
								enemy = core.material.enemys[id];
							// 检查【光环】技能，数字25
							if (enemy && core.hasSpecial(enemy.special, 25)) {
								// 检查是否是范围光环
								var inRange = enemy.haloRange == null;
								if (enemy.haloRange != null && x != null && y != null) {
									var dx = Math.abs(block.x - x),
										dy = Math.abs(block.y - y);
									// 检查十字和九宫格光环
									if (dx + dy <= enemy.haloRange) inRange = true;
									if (enemy.haloSquare && dx <= enemy.haloRange && dy <= enemy.haloRange) inRange = true;
								}
								// 检查是否可叠加
								if (inRange && (enemy.haloAdd || !usedEnemyIds[enemy.id])) {
									hp_buff += enemy.hpBuff || 0;
									atk_buff += enemy.atkBuff || 0;
									def_buff += enemy.defBuff || 0;
									usedEnemyIds[enemy.id] = true;
								}
							}
							// 检查【支援】技能，数字26
							if (enemy && core.hasSpecial(enemy.special, 26) &&
								// 检查支援条件，坐标存在，距离为1，且不能是自己
								// 其他类型的支援怪，比如十字之类的话.... 看着做是一样的
								x != null && y != null && Math.abs(block.x - x) <= 1 && Math.abs(block.y - y) <= 1 && !(x == block.x && y == block.y)) {
								// 记录怪物的x,y，ID
								guards.push([block.x, block.y, id]);
							}

							// TODO：如果有其他类型光环怪物在这里仿照添加检查
							// 注：新增新的类光环属性（需要遍历全图的）需要在特殊属性定义那里的第五项写1，参见光环和支援的特殊属性定义。
						}
					});

					core.status.checkBlock.cache[index] = { "hp_buff": hp_buff, "atk_buff": atk_buff, "def_buff": def_buff, "guards": guards };
				} else {
					// 直接使用缓存数据
					hp_buff = cache.hp_buff;
					atk_buff = cache.atk_buff;
					def_buff = cache.def_buff;
					guards = cache.guards;
				}

				// 增加比例；如果要增加数值可以直接在这里修改
				mon.hp *= (1 + hp_buff / 100);
				mon.atk *= (1 + atk_buff / 100);
				mon.def *= (1 + def_buff / 100);
			}

			// TODO：可以在这里新增其他的怪物数据变化
			// 比如仿攻（怪物攻击不低于勇士攻击）：
			// if (core.hasSpecial(mon.special, 27) && mon.atk < hero.atk) {
			//     mon.atk = hero.atk;
			// }
			// 也可以按需增加各种自定义内容

			return {
				"hp": Math.floor(mon.hp),
				"atk": Math.floor(mon.atk),
				"def": Math.floor(mon.def),
				"money": Math.floor(mon.money),
				"exp": Math.floor(mon.exp),
				"point": Math.floor(mon.point),
				"special": mon.special,
				"nextHp" : mon.nextHp == null ? undefined : Math.floor(mon.nextHp),//处理哈气脱战后的剩余血量，如果没有哈气脱战效果则默认为null
				"unableToRevive" : mon.unableToRevive == null ? undefined : Boolean(mon.unableToRevive),
				"guards": guards, // 返回支援情况
			};
		},
		"getDamageInfo": function (enemy, heroData, x, y, floorId, inGuard) {
			// 获得战斗伤害信息（实际伤害计算函数）
			// 
			// 参数说明：
			// enemy：该怪物信息
			// heroData：勇士的当前数据；如果对应项不存在则会从core.status.hero中取。
			// x,y：该怪物的坐标（查看手册和强制战斗时为undefined）
			// floorId：该怪物所在的楼层
			// 后面三个参数主要是可以在光环等效果上可以适用
			// 返回值附带 bleed 字段：模拟副本中每一条流血效果的最终值，供战后事件写回真实 bleed 对象
			floorId = floorId || core.status.floorId;

			let hero = {
				hp: core.getRealStatusOrDefault(heroData, 'hp'),
				atk: core.getRealStatusOrDefault(heroData, 'atk'),
				def: core.getRealStatusOrDefault(heroData, 'def'),
				mdef: core.getRealStatusOrDefault(heroData, 'mdef'),
				bleed: core.plugin.bleed.clone(), // 模拟用的 bleed 副本，所有流血读写只作用于副本，不碰存档
			};

			// 勇士的负属性都按0计算
			hero.hp = Math.max(0, hero.hp);
			hero.atk = Math.max(0, hero.atk);
			hero.def = Math.max(0, hero.def);
			hero.mdef = Math.max(0, hero.mdef);

			// 怪物的各项数据
			// 对坚固模仿等处理扔到了脚本编辑-getEnemyInfo之中
			let enemyInfo = core.enemys.getEnemyInfo(enemy, heroData, x, y, floorId);
			let enemyData = typeof enemy == 'string' ? core.material.enemys[enemy] : enemy;
			/** 怪物属性注册为mon对象，是原来代码的简化，原来代码参见下面被注释的内容 */
			let mon = Object.assign({}, enemyInfo);
			/*
			let mon = {
				hp: enemyInfo.hp,
				atk: enemyInfo.atk,
				def: enemyInfo.def,
				nextHp: enemyInfo.nextHp ?? null,//怪物战前要扣减hp时，这个值为扣减后的真实hp。
				unableToRevive: enemyInfo.unableToRevive ?? null,
				special: enemyInfo.special
			};
			*/

			//console.log("因为哈气再次进入战斗后的HP:"+mon.nextHp);

			/* 二倍斩先取消
			// 技能的处理
			if (core.getFlag('skill', 0) == 1) { // 开启了技能1：二倍斩
				hero.atk *= 2; // 计算时攻击力翻倍	
			}
			*/

			let debug_switch = false;

			if (debug_switch) {
			/**
			 * 穿刺削减比例函数，按穿刺比例削减防御，结果最小为0。
			 * @param {number} a 被削减的数值
			 * @param {number} b 穿刺比例，0~1
			 */
			let perReduce = (a, b) => {
				let value = a * (1 - b);
				return value * (value > 0) >> 0;
			};
			/**
			 * 非负减法函数，结果小于0时返回0。
			 * @param {number} a 被减数
			 * @param {number} b 减数
			 */
			let minusP = (a, b) => {
				return (a - b) * (a > b) * (a > 0) >> 0;
			};

			/**
			 * 目标数如果大于0则取0
			 * @param {number} a 原来的数
			 */
			let noNeg = (a) => {return (a>0)*a;}
			}

			/** 怪物的穿刺比例，用于计算魔攻等效果。 */
			mon.piece = 0;
			
			//怪物技能-魔攻：穿刺比例增加100%
			if(core.hasSpecial(mon.special, 2)){
				mon.piece+=1;
			};

			if (mon.piece>=1) {mon.piece=1}; //穿刺比例不得超过100%

			/** 本场战斗中临时有效的玩家属性。 */
			let heroInCombat = {
				atk: hero.atk,
				def: hero.def,
				mdef: hero.mdef,
				hp: hero.hp,
			};
			/** 本场战斗中临时有效的怪物属性。 */
			let monInCombat = {
				atk: mon.atk,
				def: mon.def,
				hp: mon.hp,
				piece: mon.piece,
				nextHp: mon.nextHp ?? mon.hp,//怪物战前要扣减hp时，这个值为扣减后的真实hp。
			};
			/** 本回合中临时有效的玩家属性。 */
			let heroInTurn = {
				atk: heroInCombat.atk,
				def: heroInCombat.def,
				mdef: heroInCombat.mdef,
				hp: heroInCombat.hp
			};
			/** 本回合中临时有效的怪物属性。 */
			let monInTurn = {
				atk: monInCombat.atk,
				def: monInCombat.def,
				hp: monInCombat.hp,
				piece: monInCombat.piece,
				nextHp: monInCombat.nextHp??monInCombat.hp,//怪物战前要扣减hp时，这个值为扣减后的真实hp。
			};
			/** 怪物对勇士造成的总伤害（返回值）。 */
			let damage = 0;
			/** 战前额外伤害，用于旧版伤害信息返回字段。 */
			let initDealt = 0;
			/** 总战斗回合数（返回值）。 */
			let turn = 0;
			/** 玩家连续无法破防的回合数。 */
			let noDamageTurns = 0;
			/** 战斗回合数模拟上限。 */
			const TURNS_LIMIT = 527940;
			/** 连续无法破防回合数的模拟上限。 */
			const NO_DAMAGE_TURNS_LIMIT = 37;

			//处理因哈气技能脱战后怪物的残血问题
			if(core.hasSpecial(mon.special, 5001)) monInCombat.hp = monInCombat.nextHp;

			/** 判断怪物是否具有双生技能 */
			let hasTwin = false;
			// 怪物技能——双生：拥有时 TwinActived 返回true
			if (core.hasSpecial(mon.special,5003)) hasTwin = true;

			/** 是否在本场战斗中于双生状态  
			 * 通常具有双生技能则处于双生状态
			 * 但如果怪物同时具有哈气技能，可以在战斗中途逃跑  
			 * 则非常有必要判断怪物逃跑时是否已经用掉了双生的复活效果  
			 * 否则怪物会无限次复活！
			 */
			let twinActived = hasTwin && (!mon.unableToRevive);

			/** @property {number} 战斗中承受的非战斗额外伤害，包括流血伤害 */
			let extraDamage = 0;

			/**
			 * 应用dot效果（只操作 hero.bleed 这个模拟副本，不改动存档中的真实流血状态）  
			 * 将总伤害 damage 中加入本次dot伤害  
			 * 将总额外伤害 extraDamage 中加入本次dot伤害  
			 * 令副本中的dot减少一回合持续时间，副本的最终状态随返回值交战后事件写回  
			 * @returns {void}
			 */
			let applyExtraDamage = () => {
				/** 如果添加其他dot效果可以在这里通过 && 补充 
				 * @type {boolean} */
				const APPLY_NEEDED = hero.bleed.isBleeding(); 
				if (!APPLY_NEEDED) return;

				/** 计算玩家本次将受到的额外dot伤害
				 * @returns {number}
				 */
				let calExtraDotDamage = () => {
					return hero.bleed.nextTurnDealt;
				}

				/** 先取出本回合伤害，再减少持续回合数，否则最后一回合的流血伤害会被清掉 */
				let dotDamage = calExtraDotDamage();
				hero.bleed.reduceOneTurn();

				extraDamage += dotDamage;
				damage += dotDamage;
			}


			/** 计算怪物在当前回合对勇士造成的伤害。
			 * @returns {number} 怪物在当回合造成的伤害，如无特殊效果，为怪物攻击减去玩家防御，且不小于0。
			 */
			let calTurnDealt = () => {
				/** 怪物在当回合造成的伤害，如无特殊效果，为怪物攻击减去玩家防御，且不小于0。 */
				let monsterDamage = minusP(
					monInTurn.atk,
					perReduce(heroInTurn.def, monInTurn.piece)
				);
				/** 怪物在当回合额外攻击的次数，默认为0次，即不额外攻击。 */
				let extraStrikes = 0;

				// 怪物技能——连击
				if (core.hasSpecial(mon.special, 4)) extraStrikes = 2 - 1;					//二连击
				if (core.hasSpecial(mon.special, 5)) extraStrikes = 3 - 1;					//三连击
				if (core.hasSpecial(mon.special, 6)) extraStrikes = (enemyData.n || 4) - 1;	//更多连击，默认为四连击。注意：更多连击会覆盖二连击和三连击的效果！

				// 处理怪物争先效果; 已由其他技能获得的额外攻击也参与最优次数计算。
				if (core.hasSpecial(mon.special, 5002)) {
					/**
					 * 计算通过争先最佳的额外攻击次数，该攻击次数下可对玩家造成最大的伤害。
					 * @property {number} times - 通过争先最佳的额外攻击次数
					 * @property {number} castCost - 每次额外攻击需要降低的攻击力，默认为 enemyData.costValueForMultiStrikes 属性，该属性错误时为0避免bug
					 */
					let calBestCast = () => {
						/** 怪物通过争先额外攻击一次需要降低的攻击力 */
						let castCost = Math.floor(enemyData.costValueForMultiStrikes);

						/**
						 * 验证enemyData.costValueForMultiStrikes提供的花费是否正常  
						 * 如果该数值为无限值或为NaN,null等无效值，则返回false  
						 * 如果该数值小于等于0，则怪物通过争先额外攻击没有代价，对玩家可造成无穷大的伤害，这显然是错误的，因此也返回false
						 */
						const CAST_COST_IS_NORMAL = Number.isFinite(castCost) && (castCost > 0);
						if (!CAST_COST_IS_NORMAL) {
							return {
								times:0,
								castCost:0,
							};
						}

						/* ————争先的攻击力花费正常的情况下，进入最佳额外攻击次数计算———— */

						/** 通过二次函数顶点公式计算出最优施放次数，未四舍五入 */
						const BEST_CAST_TIMES_UNROUNDED = (monsterDamage - (1 + extraStrikes) * castCost) / (2 * castCost);
						/** 最优施放次数向下取整 */
						const BEST_CAST_TIMES_FLOORED = noNeg(Math.floor(BEST_CAST_TIMES_UNROUNDED));
						/** 最优施放次数向上取整 */
						const BEST_CAST_TIMES_CEILED = noNeg(Math.ceil(BEST_CAST_TIMES_UNROUNDED));

						/** 计算使用 castTimes 次数后怪物对玩家造成的伤害
						 * @param {number} castTimes 怪物使用争先的次数
						 * @returns {number} 使用 castTimes 次数后怪物对玩家造成的伤害
						 */
						let damageByThisMultiTimes = (castTimes) =>{
							return ( 1 + extraStrikes + castTimes )* minusP( monsterDamage , castCost * castTimes );
						}

						/** 最优施放争先次数  
						 * 为施放0次，或最优次数计算值的上下取整，一共三种次数选择中造成伤害最大的那个次数  
						 * 因为不同技能之间的联动情况复杂，伤害相等时，怪物攻击次数无法给出通用最佳解  
						 * 这里认为攻击次数越多越好，可能造成和其他技能联动不正确，但这种情况极其罕见，一点点误差忽略不计
						*/
						const CAST_TIMES_CANDIDATES = [
							0,
							BEST_CAST_TIMES_FLOORED,
							BEST_CAST_TIMES_CEILED,
						];

						let bestMultiCastTimes = 0;
						/** 这个 bestMultiCastDamage 仅用作后面的for计算，不输出，因此可以为负无穷大 */
						let bestMultiCastDamage = -Infinity;

						// 按照0，向下取整，向上取整的顺序遍历三个候选攻击次数，后面的覆盖前面的
						for (let castTimes of CAST_TIMES_CANDIDATES) {
    						let damage = damageByThisMultiTimes(castTimes);
    						if (damage >= bestMultiCastDamage) {
        					bestMultiCastDamage = damage;
        					bestMultiCastTimes = castTimes;
    						}
						}
					
						return {
							times:bestMultiCastTimes,
							castCost,
						};
					}
					
					/** 计算最优施放争先次数 */
					const BEST_CAST = calBestCast();

					// 得到最优施放争先次数后，将其增加到总连击次数中
					extraStrikes += BEST_CAST.times;
					
					// 因为使用了 BEST_CAST.times 次的争先，每次攻击伤害降低了 BEST_CAST.castCost 点
					monsterDamage = minusP(monsterDamage,BEST_CAST.times*BEST_CAST.castCost);
				}

				// 额外攻击次数至少为0，不应为负数，也不应为非整数
				extraStrikes = noNeg(extraStrikes)>>0;

				// 应用所有额外攻击次数效果
				monsterDamage *= 1 + extraStrikes;

				// 怪物技能——反击
				if (core.hasSpecial(mon.special, 8)) {
					let counterAttack = enemyData.counterAttack != null
						? enemyData.counterAttack : core.values.counterAttack;
					monsterDamage += counterAttack * heroInTurn.atk;						//反击伤害不受怪物连击次数影响
				}
				//console.log("每个回合的calTurnDealt()="+monsterDamage);	
				return monsterDamage;
	
			};

			/** 计算玩家当前回合对怪物造成的伤害。 */
			//let calTurnDeal = () => {
			//	return null;
			//}

			// 无敌
			if (core.hasSpecial(mon.special, 20) && core.itemCount('cross') < 1) {
				damage = Infinity;
				return {
					"mon_hp": Math.floor(mon.hp),
					"mon_atk": Math.floor(mon.atk),
					"mon_def": Math.floor(mon.def),
					"initDealt": 0,
					//"heroDealtOfThisTurn": 0, 新版逻辑不支持
					//"heroDealOfThisTurn": 0, 新版逻辑不支持
					"turn": 0,
					"damage": Infinity,
					"extraDealt": extraDamage,
					"bleed": hero.bleed.logs,
				};
			}

			// 战斗前结算
			// 怪物技能——吸血（战斗开始时按怪物生命值比例削减玩家生命）
			if (core.hasSpecial(mon.special, 11)) {
				let vampire = enemyData.vampire != null ? enemyData.vampire : 0;
				let vampireDamage = vampire * monInCombat.hp;
				initDealt += vampireDamage;
				if (enemyData.add) monInCombat.hp += vampireDamage;
			}
			/*
			* 这段代码是错误的！无知的！  
			* 它完全是按照公式计算伤害而非回合模拟！  
			* 不要激活这个支援，想要用的话重写！!!!!
			// 怪物技能——支援
			// 支援怪先于当前怪物战斗；子战斗不重复扣除勇士护盾。
			var guards = inGuard ? [] : core.getFlag("__guards__" + x + "_" + y, enemyInfo.guards);
			if (guards.length > 0) {
				for (var i = 0; i < guards.length; i++) {
					var gx = guards[i][0],
						gy = guards[i][1],
						gid = guards[i][2];
					// 支援怪战斗时暂时移除护盾，避免子战斗重复抵扣魔防。
					var supportHero = {
						hp: heroInCombat.hp,
						atk: heroInCombat.atk,
						def: heroInCombat.def,
						mdef: 0
					};
					var supportInfo = core.enemys.getDamageInfo(
						core.material.enemys[gid],
						supportHero,
						gx,
						gy,
						floorId,
						true
					);
					// 支援战斗期间当前怪物仍会攻击勇士。
					turn += supportInfo.turn;
					damage += supportInfo.damage;
					initDealt += supportInfo.damage;
					if (!isFinite(supportInfo.turn)) {
						damage = Infinity;
					} else {
						damage += calTurnDealt() * supportInfo.turn;
					}
				}
			}
			*/

			// 怪物技能——先攻；在勇士第一次攻击前结算。
			if (core.hasSpecial(mon.special, 1)) {
				let firstStrike = calTurnDealt();
				initDealt += firstStrike;
			}
			// 破甲和净化均在战斗开始时造成伤害。
			// 怪物技能——破甲
			if (core.hasSpecial(mon.special, 7)) {
				let breakArmor = enemyData.breakArmor != null
					? enemyData.breakArmor : core.values.breakArmor;
				let breakArmorDamage = breakArmor * hero.def;
				initDealt += breakArmorDamage;
			}
			// 怪物技能——净化
			if (core.hasSpecial(mon.special, 9)) {
				let purify = enemyData.purify != null ? enemyData.purify : core.values.purify;
				let purifyDamage = hero.mdef * purify;
				initDealt += purifyDamage;
			}

			// 怪物处于双生状态时所有战前伤害加倍
			if (twinActived) initDealt *= 2;

			// 将战前伤害加入总伤害之中
			damage += initDealt;

			// 玩家每回合对怪物造成的伤害，以及怪物每回合对玩家造成的伤害。
			let heroDealOfThisTurn = 0;
			let heroDealtOfThisTurn = 0;

			// 正式进入战斗回合。
			while (true) {
				// 回合数或无法破防回合数超限，判定为无法击败怪物。
				if (turn > TURNS_LIMIT || noDamageTurns > NO_DAMAGE_TURNS_LIMIT) {
					turn = Infinity;
					damage = Infinity;
					break;
				}
				// 回合数增加，更新本回合属性。
				turn += 1;
				Object.assign(heroInTurn, heroInCombat);
				Object.assign(monInTurn, monInCombat);

				// 回合一开始，令玩家受到dot伤害；流血状态的推进只发生在 hero.bleed 副本上
				applyExtraDamage();

				/** 玩家在当前回合将要造成的伤害。 */
				heroDealOfThisTurn = minusP(heroInTurn.atk, monInTurn.def);
				// 未能破防则累计无法破防回合，否则重置计数。
				if (heroDealOfThisTurn <= 0) {
					noDamageTurns += 1;
				} else {
					noDamageTurns = 0;
				}

				/**
				* 哈气技能结算的一部分
				* 在玩家正式攻击怪物前，表示当前生命值相当于多少个“最大生命值的 25%”档位。
 				* 为正整数
 				*/
				let quarters = Math.ceil(4*monInCombat.hp/mon.hp);

				// 玩家正式攻击怪物
				monInCombat.hp -= heroDealOfThisTurn;
				// 怪物被击败时：
				if (monInCombat.hp <= 0) {
					// 怪物技能——双生：如果处于双生阶段，则只死亡一只怪物，另一只仍然可以战斗，不结束战斗
					if(twinActived==true){
						/** 为了和哈气技能正确结算，这里必须使用 enemyInfo.hp 得到怪物满血时的HP  
						 * 如果使用 mon.hp ，那么会得到哈气怪物逃跑后残血的HP，这是错误的！!!!!
						 */
						monInCombat.hp = enemyInfo.hp;
						// 取消双生状态
						twinActived = false;
					}
					// 没有双生状态时战斗才结束。
					else break;
				}
				// 哈气技能计算：是否怪物的生命值下降了一个或更多“最大生命值的 25%”档位。
				if (core.hasSpecial(mon.special,5001)) {
					/**
					 * 哈气技能结算的一部分
					 * 在玩家正式攻击怪物后，怪物生命更新，再次计算此时的生命值相当于多少个“最大生命值的 25%”档位。
					 * 为正整数
					 */
					let quartersNew = Math.ceil(4*monInCombat.hp/mon.hp);
					if (quartersNew<quarters&&quarters>0) break; //如果25%档位下降，且没有消灭怪物，则怪物脱战逃跑，break战斗循环
				}

				// 怪物攻击开始：使用技能结算后的本回合属性。
				Object.assign(heroInTurn, heroInCombat);
				Object.assign(monInTurn, monInCombat);
				heroDealtOfThisTurn = calTurnDealt();
				//如果怪物处于双生状态，那么两只怪物都要结算一次伤害
				if (twinActived==true) heroDealtOfThisTurn += calTurnDealt();
				damage += heroDealtOfThisTurn;
			}
			// 魔防抵消普通战斗伤害；关闭负伤时普通伤害不低于零。
			damage -= hero.mdef;
			if (!core.flags.enableNegativeDamage && damage < 0)
				damage = 0;
			// 固伤和仇恨不受魔防抵消。
			if (core.hasSpecial(mon.special, 22))
				damage += enemyData.damage != null ? enemyData.damage : 0;
			if (core.hasSpecial(mon.special, 17))
				damage += core.getFlag('hatred', 0);

			return {
				"mon_hp": Math.floor(mon.hp),
				"mon_atk": Math.floor(mon.atk),
				"mon_def": Math.floor(mon.def),
				"initDealt": Math.floor(initDealt),
				//"heroDealtOfThisTurn": Math.floor(heroDealtOfThisTurn), 新版逻辑不支持
				//"heroDealOfThisTurn": Math.floor(heroDealOfThisTurn), 新版逻辑不支持
				"turn": turn,
				"damage": Math.floor(damage),
				/**如果怪物有哈气技能（能脱战逃跑）且未被直接杀死，返回脱战时剩余的HP，否则此项为未定义*/
				"monHpLeft": core.hasSpecial(mon.special, 5001)&&(monInCombat.hp>0) ? Math.floor(monInCombat.hp) : void 0, 
				/**只有怪物有双生技能时此项才非undefined  
				 * 通常返回false，因为怪物已经在战斗中被击败，双生技能免死一次的一次性效果已经消耗  
				 * 只有在怪物未被击败的情况下战斗结束才可能为true（如哈气）
				 * 但要注意：怪物也可能在消耗了双生效果后才脱战，因此并非怪物只要脱战了就返回true！
				 */
				"twinReviveUsed": (!core.hasSpecial(mon.special, 5003)) ? void 0
					: twinActived!==true ? true : false,
				"extraDealt": extraDamage,				
				"bleed": hero.bleed.logs,
			};
		}
	},
	"actions": {
		"onKeyUp": function (keyCode, altKey) {
			// 键盘按键处理，可以在这里自定义快捷键列表
			// keyCode：当前按键的keyCode（每个键的keyCode自行百度）
			// altKey：Alt键是否被按下，为true代表同时按下了Alt键
			// 可以在这里任意增加或编辑每个按键的行为

			// 如果处于正在行走状态，则不处理
			if (core.isMoving()) return;

			// 商店长按时忽略
			if (core.status.onShopLongDown) return core.status.onShopLongDown = false;

			// Alt+0~9，快捷换上套装
			if (altKey && keyCode >= 48 && keyCode <= 57) {
				core.items.quickLoadEquip(keyCode - 48);
				return;
			}

			// 根据keyCode值来执行对应操作
			switch (keyCode) {
				case 27: // ESC：打开菜单栏
					core.openSettings(true);
					break;
				case 88: // X：使用怪物手册
					core.openBook(true);
					break;
				case 71: // G：使用楼传器
					core.useFly(true);
					break;
				case 65: // A：读取自动存档（回退）
					core.doSL("autoSave", "load");
					break;
				case 87: // W：撤销回退
					core.doSL("autoSave", "reload");
					break;
				case 83: // S：存档
					core.save(true);
					break;
				case 68: // D：读档
					core.load(true);
					break;
				case 69: // E：打开光标
					core.ui._drawCursor();
					break;
				case 84: // T：打开道具栏
					core.openToolbox(true);
					break;
				case 81: // Q：打开装备栏
					core.openEquipbox(true);
					break;
				case 90: // Z：转向
					core.turnHero();
					break;
				case 86: // V：打开快捷商店列表
					core.openQuickShop(true);
					break;
				case 32: // SPACE：轻按
					core.getNextItem();
					break;
				case 82: // R：回放录像
					core.ui._drawReplay();
					break;
				case 33:
				case 34: // PgUp/PgDn：浏览地图
					core.ui._drawViewMaps();
					break;
				case 66: // B：打开数据统计
					core.ui._drawStatistics();
					break;
				case 72: // H：打开帮助页面
					core.ui._drawHelp();
					break;
				case 77: // M：打开存档笔记
					core.actions._clickNotes_show();
					break;
				case 78: // N：重新开始
					core.confirmRestart();
					break;
				case 79: // O：查看工程
					core.actions._clickGameInfo_openProject();
					break;
				case 80: // P：游戏主页
					core.actions._clickGameInfo_openComments();
					break;
				case 49: // 快捷键1: 破
					if (core.hasItem('pickaxe')) {
						core.status.route.push("key:49"); // 将按键记在录像中
						core.useItem('pickaxe', true); // 第二个参数true代表该次使用道具是被按键触发的，使用过程不计入录像
					}
					break;
				case 50: // 快捷键2: 炸
					if (core.hasItem('bomb')) {
						core.status.route.push("key:50"); // 将按键记在录像中
						core.useItem('bomb', true); // 第二个参数true代表该次使用道具是被按键触发的，使用过程不计入录像
					}
					break;
				case 51: // 快捷键3: 飞
					if (core.hasItem('centerFly')) {
						core.ui._drawCenterFly();
					}
					break;
				case 52: // 快捷键4：破冰/冰冻/地震/上下楼器/... 其他道具依次判断
					{
						var list = ["icePickaxe", "freezeBadge", "earthquake", "upFly", "downFly", "jumpShoes", "lifeWand", "poisonWine", "weakWine", "curseWine", "superWine"];
						for (var i = 0; i < list.length; i++) {
							var itemId = list[i];
							if (core.canUseItem(itemId)) {
								core.status.route.push("key:52");
								core.useItem(itemId, true);
								break;
							}
						}
					}
					break;
				case 53: // 5：读取自动存档（回退），方便手机版操作
					core.doSL("autoSave", "load");
					break;
				case 54: // 6：撤销回退，方便手机版操作
					core.doSL("autoSave", "reload");
					break;
				case 55: // 快捷键7：绑定为轻按，方便手机版操作
					core.getNextItem();
					break;
				case 118: // F7：开启debug模式
				case 119: // F8：由于F7与部分浏览器有冲突，故新增F8
					core.debug();
					break;
				case 70: // F：开启技能“二倍斩”
					// 检测是否拥有“二倍斩”这个技能道具
					if (core.hasItem('skill1')) {
						core.status.route.push("key:70");
						core.useItem('skill1', true);
					}
					break;
				// 在这里可以任意新增或编辑已有的快捷键内容
				/*
				case 0: // 使用该按键的keyCode
					// 还可以再判定altKey是否被按下，即 if (altKey) { ...
		
					// ... 在这里写你要执行脚本
					// **强烈建议所有新增的自定义快捷键均能给个对应的道具可点击，以方便手机端的行为**
					if (core.hasItem('...')) {
						core.status.route.push("key:0");
						core.useItem('...', true); // 增加true代表该使用道具不计入录像
					}
		
					break;
				*/
			}

		},
		"onStatusBarClick": function (px, py, vertical) {
			// 点击状态栏时触发的事件，仅在自绘状态栏开启时生效
			// px和py为点击的像素坐标
			// vertical为录像播放过程中的横竖屏信息
			// 
			// 横屏模式下状态栏的画布大小是 129*416 （开启拓展装备栏后是 129*457）
			// 竖屏模式下状态栏的画布大小是 416*(32*rows+9) 其中rows为状态栏行数，即全塔属性中statusCanvasRowsOnMobile值
			// 可以使用 _isVertical() 来判定当前是否是竖屏模式

			// 判定当前是否是竖屏模式。录像播放过程中可能会记录当时的横竖屏信息以覆盖。
			var _isVertical = function () {
				if (core.isReplaying() && vertical != null) return vertical;
				return core.domStyle.isVertical;
			}

			// 如果正在执行事件，则忽略
			if (core.status.lockControl) return;
			// 如果当前正在行走，则忽略；也可以使用 core.waitHeroToStop(callback) 来停止行走再回调执行脚本
			if (core.isMoving()) return;

			// 判定px和py来执行自己的脚本内容.... 注意横竖屏
			// console.log("onStatusBarClick: ", px, py, _isVertical());

			// 样例一：点击某个区域后使用一个道具
			/*
			if (core.hasItem("pickaxe")) {
				if (_isVertical()) {
					// 竖屏模式下
					if (px >= 200 && px <= 250 && py >= 50 && py <= 100) {
						core.useItem("pickaxe");
					}
				} else {
					// 横屏模式下
					if (px >= 50 && px <= 100 && py >= 200 && py <= 250) {
						core.useItem("pickaxe");
					}
				}
			}
			*/

			// 样例二：点击某个区域后执行一段公共事件或脚本
			/*
			if (core.hasFlag("xxx")) {
				if (_isVertical()) {
					// 竖屏模式下
					if (px >= 200 && px <= 250 && py >= 50 && py <= 100) {
						// 记录点击坐标。这里的1代表此时是竖屏！
						core.status.route.push("click:1:" + px + ":" + py);
						// 可以插入公共事件 / 普通事件 / 执行一段脚本（如打开自绘UI或增减flag）
						core.insertCommonEvent("道具商店");
						// core.insertAction(["一段事件"]);
						// core.openItemShop("shop1");
					}
				} else {
					// 横屏模式下
					if (px >= 50 && px <= 100 && py >= 200 && py <= 250) {
						// 记录点击坐标。这里的0代表此时是横屏！
						core.status.route.push("click:0:" + px + ":" + py);
						// 可以插入公共事件 / 普通事件 / 执行一段脚本（如打开自绘UI或增减flag）
						core.insertCommonEvent("道具商店");
						// core.insertAction(["一段事件"]);
						// core.openItemShop("shop1");
					}
				}
			}
			*/

		}
	},
	"control": {
		"saveData": function () {
			// 存档操作，此函数应该返回“具体要存档的内容”

			// 差异化存储values
			var values = {};
			for (var key in core.values) {
				if (!core.same(core.values[key], core.data.values[key]))
					values[key] = core.clone(core.values[key]);
			}

			// 要存档的内容
			var data = {
				'floorId': core.status.floorId,
				'hero': core.clone(core.status.hero),
				'hard': core.status.hard,
				'maps': core.clone(core.maps.saveMap()),
				'route': core.encodeRoute(core.status.route),
				'values': values,
				'version': core.firstData.version,
				'guid': core.getGuid(),
				"time": new Date().getTime()
			};

			return data;
		},
		"loadData": function (data, callback) {
			// 读档操作；从存储中读取了内容后的行为

			// 重置游戏和路线
			core.resetGame(data.hero, data.hard, data.floorId, core.maps.loadMap(data.maps, null, data.hero.flags), data.values);
			core.status.route = core.decodeRoute(data.route);
			core.control._bindRoutePush();
			// 文字属性，全局属性
			core.status.textAttribute = core.getFlag('textAttribute', core.status.textAttribute);
			var toAttribute = core.getFlag('globalAttribute', core.status.globalAttribute);
			if (!core.same(toAttribute, core.status.globalAttribute)) {
				core.status.globalAttribute = toAttribute;
				core.resize();
			}
			// 重置音量
			core.events.setVolume(core.getFlag("__volume__", 1), 0);
			// 加载勇士图标
			var icon = core.status.hero.image;
			icon = core.getMappedName(icon);
			if (core.material.images.images[icon]) {
				core.material.images.hero = core.material.images.images[icon];
				core.material.icons.hero.width = core.material.images.images[icon].width / 4;
				core.material.icons.hero.height = core.material.images.images[icon].height / 4;
			}
			core.setFlag('__fromLoad__', true);

			// TODO：增加自己的一些读档处理

			// 切换到对应的楼层
			core.changeFloor(data.floorId, null, data.hero.loc, 0, function () {
				// TODO：可以在这里设置读档后播放BGM
				if (core.hasFlag("__bgm__")) { // 持续播放
					core.playBgm(core.getFlag("__bgm__"));
				}

				core.removeFlag('__fromLoad__');
				if (callback) callback();
			});
		},
		"getStatusLabel": function (name) {
			// 返回某个状态英文名的对应中文标签，如atk -> 攻击，def -> 防御等。
			// 请注意此项仅影响 libs/ 下的内容（如绘制怪物手册、数据统计等）
			// 自行定义的（比如获得道具效果）中用到的“攻击+3”等需要自己去对应地方修改

			return {
				name: "名称",
				lv: "等级",
				hpmax: "生命上限",
				hp: "生命",
				manamax: "魔力上限",
				mana: "魔力",
				atk: "攻击",
				def: "防御",
				mdef: "护盾",
				money: "金币",
				exp: "经验",
				point: "加点",
				steps: "步数",
			}[name] || name;
		},
		"triggerDebuff": function (action, type) {
			// 毒衰咒效果的获得与解除
			// action：获得还是解除；'get'表示获得，'remove'表示解除
			// type：一个数组表示获得了哪些毒衰咒效果；poison, weak，curse
			if (!(type instanceof Array)) type = [type];

			if (action == 'get') {
				if (core.inArray(type, 'poison') && !core.hasFlag("poison")) {
					// 获得毒效果
					core.setFlag('poison', true);
				}
				if (core.inArray(type, 'weak') && !core.hasFlag('weak')) {
					// 获得衰效果
					core.setFlag('weak', true);
					if (core.values.weakValue >= 1) {
						// >=1，直接扣数值
						core.addStatus('atk', -core.values.weakValue);
						core.addStatus('def', -core.values.weakValue);
					} else {
						// <1，扣比例
						core.addBuff('atk', -core.values.weakValue);
						core.addBuff('def', -core.values.weakValue);
					}
				}
				if (core.inArray(type, 'curse') && !core.hasFlag('curse')) {
					// 获得咒效果
					core.setFlag('curse', true);
				}
			} else if (action == 'remove') {
				var success = false;
				if (core.inArray(type, "poison") && core.hasFlag("poison")) {
					success = true;
					// 移除毒效果
					core.setFlag("poison", false);
				}
				if (core.inArray(type, "weak") && core.hasFlag("weak")) {
					success = true;
					// 移除衰效果
					core.setFlag("weak", false);
					if (core.values.weakValue >= 1) {
						// >=1，直接扣数值
						core.addStatus('atk', core.values.weakValue);
						core.addStatus('def', core.values.weakValue);
					} else {
						// <1，扣比例
						core.addBuff('atk', core.values.weakValue);
						core.addBuff('def', core.values.weakValue);
					}
				}
				if (core.inArray(type, "curse") && core.hasFlag("curse")) {
					success = true;
					// 移除咒效果
					core.setFlag("curse", false);
				}
				if (success) core.playSound('回血');
			}
		},
		"updateStatusBar": function () {
			// 更新状态栏

			// 检查等级
			core.events.checkLvUp();

			// 检查HP上限
			if (core.flags.statusBarItems.indexOf('enableHPMax') >= 0) {
				core.setStatus('hp', Math.min(core.getRealStatus('hpmax'), core.getStatus('hp')));
			}

			// 设置楼层名
			if (core.status.floorId) {
				core.setStatusBarInnerHTML('floor', core.status.maps[core.status.floorId].name);
			}

			// 设置勇士名字和图标
			core.setStatusBarInnerHTML('name', core.getStatus('name'));
			// 设置等级名称
			core.setStatusBarInnerHTML('lv', core.getLvName());

			// 设置生命上限、生命值、攻防护盾金币和经验值
			var statusList = ['hpmax', 'hp', 'mana', 'atk', 'def', 'mdef', 'money', 'exp'];
			statusList.forEach(function (item) {
				// 向下取整
				core.status.hero[item] = Math.floor(core.status.hero[item]);
				// 大数据格式化
				core.setStatusBarInnerHTML(item, core.getRealStatus(item));
			});

			// 设置魔力值; status:manamax 只有在非负时才生效。
			if (core.status.hero.manamax != null && core.getRealStatus('manamax') >= 0) {
				core.status.hero.mana = Math.min(core.status.hero.mana, core.getRealStatus('manamax'));
				core.setStatusBarInnerHTML('mana', core.status.hero.mana + "/" + core.getRealStatus('manamax'));
			} else {
				core.setStatusBarInnerHTML("mana", core.status.hero.mana);
			}
			// 设置技能栏
			// 可以用flag:skill表示当前开启的技能类型，flag:skillName显示技能名；详见文档-个性化-技能塔的支持
			core.setStatusBarInnerHTML('skill', core.getFlag('skillName', '无'));

			// 可以在这里添加自己额外的状态栏信息，比如想攻击显示 +0.5 可以这么写：
			// if (core.hasFlag('halfAtk')) core.setStatusBarInnerHTML('atk', core.statusBar.atk.innerText + "+0.5");

			// 如果是自定义添加的状态栏，也需要在这里进行设置显示的数值

			// 进阶
			if (core.flags.statusBarItems.indexOf('enableLevelUp') >= 0) {
				core.setStatusBarInnerHTML('up', core.formatBigNumber(core.getNextLvUpNeed()) || "");
			} else core.setStatusBarInnerHTML('up', "");

			// 钥匙
			var keys = ['yellowKey', 'blueKey', 'redKey', 'greenKey'];
			keys.forEach(function (key) {
				core.setStatusBarInnerHTML(key, core.setTwoDigits(core.itemCount(key)));
			});
			// 毒衰咒
			core.setStatusBarInnerHTML('poison', core.hasFlag('poison') ? "毒" : "");
			core.setStatusBarInnerHTML('weak', core.hasFlag('weak') ? "衰" : "");
			core.setStatusBarInnerHTML('curse', core.hasFlag('curse') ? "咒" : "");
			// 破炸飞
			core.setStatusBarInnerHTML('pickaxe', "破" + core.itemCount('pickaxe'));
			core.setStatusBarInnerHTML('bomb', "炸" + core.itemCount('bomb'));
			core.setStatusBarInnerHTML('fly', "飞" + core.itemCount('centerFly'));

			// 设置流血
			if (core.plugin.bleed.isBleeding()) {
				/** 显示流血剩余回合数 
				 * @type {string}
				*/
				const BLEED_TEXT_TURNS = Number.isFinite(core.plugin.bleed.turnsLeft) 
					? core.plugin.bleed.turnsLeft.toString() 
					: "永久";
				/** 显示“流血 [剩余回合数]” */
				const BLEED_TEXT_TO_DISPLAY = "流血 " + BLEED_TEXT_TURNS;
				core.setStatusBarInnerHTML('bleed', BLEED_TEXT_TO_DISPLAY ,'color: #FF8888');
			}
			else core.setStatusBarInnerHTML('bleed', "" , 'color: #FF8888');

			// 难度
			if (core.statusBar.hard.innerText != core.status.hard) {
				core.statusBar.hard.innerText = core.status.hard;
			}
			var hardColor = core.getFlag('__hardColor__');
			if (hardColor == null) core.statusBar.hard.innerText = '';
			if (core.statusBar.hard.getAttribute('_style') != hardColor) {
				core.statusBar.hard.style.color = hardColor;
				core.statusBar.hard.setAttribute('_style', hardColor);
			}
			// 自定义状态栏绘制
			core.drawStatusBar();

			// 更新阻激夹域的伤害值
			core.updateCheckBlock();
			// updateDamage只能在此处执行！！更新全地图显伤
			core.updateDamage();
		},
		"updateCheckBlock": function (floorId) {
			// 领域、夹击、阻击等的伤害值计算
			floorId = floorId || core.status.floorId;
			if (!floorId || !core.status.maps) return;

			var width = core.floors[floorId].width,
				height = core.floors[floorId].height;
			var blocks = core.getMapBlocksObj(floorId);

			var damage = {}, // 每个点的伤害值
				type = {}, // 每个点的伤害类型
				repulse = {}, // 每个点的阻击怪信息
				tax = {}, // 每个点的扣税怪信息
				ambush = {}; // 每个点的捕捉信息
			var betweenAttackLocs = {}; // 所有可能的夹击点
			var needCache = false;
			var canGoDeadZone = core.flags.canGoDeadZone;
			core.flags.canGoDeadZone = true;

			// 计算血网和领域、阻击、激光的伤害，计算捕捉信息
			for (var loc in blocks) {
				var block = blocks[loc],
					x = block.x,
					y = block.y,
					id = block.event.id,
					enemy = core.material.enemys[id];
				if (block.disable) continue;

				type[loc] = type[loc] || {};

				// 血网
				// 如需调用当前楼层的ratio可使用  core.status.maps[floorId].ratio
				if (id == 'lavaNet' && !core.hasItem('amulet')) {
					damage[loc] = (damage[loc] || 0) + core.values.lavaDamage;
					type[loc][(block.event.name || "血网") + "伤害"] = true;
				}

				// 领域
				// 如果要防止领域伤害，可以直接简单的将 flag:no_zone 设为true
				if (enemy && core.hasSpecial(enemy.special, 15) && !core.hasFlag('no_zone')) {
					// 领域范围，默认为1
					let range = enemy.range || 1;
					// 是否是九宫格领域
					let zoneSquare = false;
					if (enemy.zoneSquare != null) zoneSquare = enemy.zoneSquare;
					// 在范围内进行搜索，增加领域伤害值
					for (let dx = -range; dx <= range; dx++) {
						for (let dy = -range; dy <= range; dy++) {
							if (dx == 0 && dy == 0) continue;
							let nx = x + dx,
								ny = y + dy,
								currloc = nx + "," + ny;
							if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
							// 如果是十字领域，则还需要满足 |dx|+|dy|<=range
							if (!zoneSquare && Math.abs(dx) + Math.abs(dy) > range) continue;
							damage[currloc] = (damage[currloc] || 0) + (enemy.zone || 0);
							type[currloc] = type[currloc] || {};
							type[currloc]["领域伤害"] = true;
						}
					}
				}

				// 哈气
				// 如果要防止领域伤害，可以直接简单的将 flag:no_zone 设为true
				if (enemy && core.hasSpecial(enemy.special, 5001) && !core.hasFlag('no_hiss')) {
					// 范围，默认为1
					let range = enemy.range || 1;
					// 是否是九宫格，哈气默认不是
					let zoneSquare = false;
					if (enemy.zoneSquare != null && false) zoneSquare = enemy.zoneSquare;
					// 在范围内进行搜索，增加哈气伤害值
					for (let dx = -range; dx <= range; dx++) {
						for (let dy = -range; dy <= range; dy++) {
							if (dx == 0 && dy == 0) continue;
							let nx = x + dx,
								ny = y + dy,
								currloc = nx + "," + ny;
							if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
							// 如果是十字领域，则还需要满足 |dx|+|dy|<=range
							if (!zoneSquare && Math.abs(dx) + Math.abs(dy) > range) continue;
							damage[currloc] = (damage[currloc] || 0) + (enemy.hissValue??enemy.value??0);
							type[currloc] = type[currloc] || {};
							type[currloc]["哈气伤害"] = true;
						}
					}
				}

				// 阻击
				// 如果要防止阻击伤害，可以直接简单的将 flag:no_repulse 设为true
				if (enemy && core.hasSpecial(enemy.special, 18) && !core.hasFlag('no_repulse')) {
					var scan = enemy.zoneSquare ? core.utils.scan2 : core.utils.scan;
					for (var dir in scan) {
						var nx = x + scan[dir].x,
							ny = y + scan[dir].y,
							currloc = nx + "," + ny;
						if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
						damage[currloc] = (damage[currloc] || 0) + (enemy.repulse || 0);
						type[currloc] = type[currloc] || {};
						type[currloc]["阻击伤害"] = true;

						var rdir = core.turnDirection(":back", dir);
						// 检查下一个点是否存在事件（从而判定是否移动）
						var rnx = x + scan[rdir].x,
							rny = y + scan[rdir].y;
						if (rnx < 0 || rnx >= width || rny < 0 || rny >= height) continue;
						// 如需禁止阻击被推到已隐藏的事件处（如重生怪处），可将这一句的false改为true
						if (core.getBlock(rnx, rny, floorId, false) != null) continue;
						if (core.utils.scan[rdir] && !core.canMoveHero(x, y, rdir, floorId)) continue;
						repulse[currloc] = (repulse[currloc] || []).concat([
							[x, y, id, rdir]
						]);
					}
				}

				// 扣税
				if (enemy && core.hasSpecial(enemy.special, 11001)) {
					var scan = enemy.zoneSquare ? core.utils.scan2 : core.utils.scan;
					for (var dir in scan) {
						var nx = x + scan[dir].x,
							ny = y + scan[dir].y,
							currloc = nx + "," + ny;
						if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

						var rdir = core.turnDirection(":back", dir),
							rnx = x + scan[rdir].x,
							rny = y + scan[rdir].y,
							canRetreat = rnx >= 0 && rnx < width && rny >= 0 && rny < height &&
								core.getBlock(rnx, rny, floorId, false) == null &&
								(!core.utils.scan[rdir] || core.canMoveHero(x, y, rdir, floorId));
						tax[currloc] = (tax[currloc] || []).concat([
							[x, y, id, rdir, enemy.tax || 10, canRetreat]
						]);
					}
				}

				// 激光
				// 如果要防止激光伤害，可以直接简单的将 flag:no_laser 设为true
				if (enemy && core.hasSpecial(enemy.special, 24) && !core.hasFlag("no_laser")) {
					for (var nx = 0; nx < width; nx++) {
						var currloc = nx + "," + y;
						if (nx != x) {
							damage[currloc] = (damage[currloc] || 0) + (enemy.laser || 0);
							type[currloc] = type[currloc] || {};
							type[currloc]["激光伤害"] = true;
						}
					}
					for (var ny = 0; ny < height; ny++) {
						var currloc = x + "," + ny;
						if (ny != y) {
							damage[currloc] = (damage[currloc] || 0) + (enemy.laser || 0);
							type[currloc] = type[currloc] || {};
							type[currloc]["激光伤害"] = true;
						}
					}
				}

				// 捕捉
				// 如果要防止捕捉效果，可以直接简单的将 flag:no_ambush 设为true
				if (enemy && core.enemys.hasSpecial(enemy.special, 27) && !core.hasFlag("no_ambush")) {
					var scan = enemy.zoneSquare ? core.utils.scan2 : core.utils.scan;
					// 给周围格子加上【捕捉】记号
					for (var dir in scan) {
						var nx = x + scan[dir].x,
							ny = y + scan[dir].y,
							currloc = nx + "," + ny;
						if (nx < 0 || nx >= width || ny < 0 || ny >= height || (core.utils.scan[dir] && !core.canMoveHero(x, y, dir, floorId))) continue;
						ambush[currloc] = (ambush[currloc] || []).concat([
							[x, y, id, dir]
						]);
					}
				}

				// 夹击；在这里提前计算所有可能的夹击点，具体计算逻辑在下面
				// 如果要防止夹击伤害，可以简单的将 flag:no_betweenAttack 设为true
				if (enemy && core.enemys.hasSpecial(enemy.special, 16) && !core.hasFlag('no_betweenAttack')) {
					for (var dir in core.utils.scan) {
						var nx = x + core.utils.scan[dir].x,
							ny = y + core.utils.scan[dir].y,
							currloc = nx + "," + ny;
						if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
						betweenAttackLocs[currloc] = true;
					}
				}

				// 检查地图范围类技能
				var specialFlag = core.getSpecialFlag(enemy);
				if (specialFlag & 1) needCache = true;
				if (core.status.event.id == 'viewMaps') needCache = true;
				if ((core.status.event.id == 'book' || core.status.event.id == 'bool-detail') && core.status.event.ui) needCache = true;
			}

			// 对每个可能的夹击点计算夹击伤害
			for (var loc in betweenAttackLocs) {
				var xy = loc.split(","),
					x = parseInt(xy[0]),
					y = parseInt(xy[1]);
				// 夹击怪物的ID
				var enemyId1 = null,
					enemyId2 = null;
				// 检查左右夹击
				var leftBlock = blocks[(x - 1) + "," + y],
					rightBlock = blocks[(x + 1) + "," + y];
				var leftId = core.getFaceDownId(leftBlock),
					rightId = core.getFaceDownId(rightBlock);
				if (leftBlock && !leftBlock.disable && rightBlock && !rightBlock.disable && leftId == rightId) {
					if (core.hasSpecial(leftId, 16))
						enemyId1 = leftId;
				}
				// 检查上下夹击
				var topBlock = blocks[x + "," + (y - 1)],
					bottomBlock = blocks[x + "," + (y + 1)];
				var topId = core.getFaceDownId(topBlock),
					bottomId = core.getFaceDownId(bottomBlock);
				if (topBlock && !topBlock.disable && bottomBlock && !bottomBlock.disable && topId == bottomId) {
					if (core.hasSpecial(topId, 16))
						enemyId2 = topId;
				}

				if (enemyId1 != null || enemyId2 != null) {
					var leftHp = core.status.hero.hp - (damage[loc] || 0);
					if (leftHp > 1) {
						// 夹击伤害值
						var value = Math.floor(leftHp / 2);
						// 是否不超过怪物伤害值
						if (core.flags.betweenAttackMax) {
							var enemyDamage1 = core.getDamage(enemyId1, x, y, floorId);
							if (enemyDamage1 != null && enemyDamage1 < value)
								value = enemyDamage1;
							var enemyDamage2 = core.getDamage(enemyId2, x, y, floorId);
							if (enemyDamage2 != null && enemyDamage2 < value)
								value = enemyDamage2;
						}
						if (value > 0) {
							damage[loc] = (damage[loc] || 0) + value;
							type[loc] = type[loc] || {};
							type[loc]["夹击伤害"] = true;
						}
					}
				}
			}

			// 取消注释下面这一段可以让护盾抵御阻激夹域伤害
			/*
			for (var loc in damage) {
				damage[loc] = Math.max(0, damage[loc] - core.getRealStatus('mdef'));
			}
			*/

			core.flags.canGoDeadZone = canGoDeadZone;
			core.status.checkBlock = {
				damage: damage,
				type: type,
				repulse: repulse,
				tax: tax,
				ambush: ambush,
				needCache: needCache,
				cache: {} // clear cache
			};
		},
		//缴税技能结算
		"checkTax": function (tax) {
			//没有缴税技能，不结算缴税，返回true表示玩家可金币可承担缴税（此处不需要缴税，因此相当于可承担）。
			if (!tax || tax.length == 0) return true;

			var actions = []; 
			for (var i = 0; i < tax.length; i++) {
				var item = tax[i],
					amount = item[4];
				//如果玩家金币小于要缴纳的所有税款，则无法承担缴税，玩家死亡，返回true表示无法缴税。
				if (core.status.hero.money < amount) {
					core.status.hero.hp = 0;
					core.updateStatusBar(false, true);
					core.events.lose();
					return false;
				}

				core.status.hero.money -= amount;
				core.drawTip("缴纳" + amount + "金币");
				if (item[5]) {
					var alreadyRepulsed = (core.status.checkBlock.repulse[core.getHeroLoc('x') + "," + core.getHeroLoc('y')] || []).some(function (repulse) {
						return repulse[0] == item[0] && repulse[1] == item[1] && repulse[2] == item[2];
					});
					if (!alreadyRepulsed) {
						actions.push({ "type": "move", "loc": [item[0], item[1]], "steps": [item[3]], "time": 250, "keep": true, "async": true });
					}
				}
			}
			core.updateStatusBar(false, true);

			if (actions.length > 0) {
				actions.push({ "type": "waitAsync" });
				core.insertAction(actions);
			}
			//玩家成功缴纳所有税款，缴税成功返回true。
			return true;
		},
		"moveOneStep": function (callback) {
			// 勇士每走一步后执行的操作。callback为行走完毕后的回调
			// 这个函数执行在“刚走完”的时候，即还没有检查该点的事件和领域伤害等。
			// 请注意：瞬间移动不会执行该函数。如果要控制能否瞬间移动有三种方法：
			// 1. 将全塔属性中的cannotMoveDirectly这个开关勾上，即可在全塔中全程禁止使用瞬移。
			// 2, 将楼层属性中的cannotMoveDirectly这个开关勾上，即禁止在该层楼使用瞬移。
			// 3. 将flag:cannotMoveDirectly置为true，即可使用flag控制在某段剧情范围内禁止瞬移。

			// 增加步数
			core.status.hero.steps++;
			// 更新跟随者状态，并绘制
			core.updateFollowers();
			core.drawHero();
			// 检查中毒状态的扣血和死亡
			if (core.hasFlag('poison')) {
				core.status.hero.statistics.poisonDamage += core.values.poisonDamage;
				core.status.hero.hp -= core.values.poisonDamage;
				if (core.status.hero.hp <= 0) {
					core.status.hero.hp = 0;
					core.updateStatusBar(false, true);
					core.events.lose();
					return;
				} else {
					core.updateStatusBar(false, true);
				}
			}

			// 从v2.7开始，每一步行走不会再刷新状态栏。
			// 如果有特殊要求（如每走一步都加buff之类），可手动取消注释下面这一句：
			// core.updateStatusBar(true, true);

			// 检查自动事件
			core.checkAutoEvents();

			// ------ 检查目标点事件 ------ //
			// 无事件的道具（如血瓶）需要优先于阻激夹域判定
			var nowx = core.getHeroLoc('x'),
				nowy = core.getHeroLoc('y');
			var block = core.getBlock(nowx, nowy);
			var hasTrigger = false;
			if (block != null && block.event.trigger == 'getItem' &&
				!core.floors[core.status.floorId].afterGetItem[nowx + "," + nowy]) {
				hasTrigger = true;
				core.trigger(nowx, nowy, callback);
			}
			// 执行目标点的阻激夹域事件
			core.checkBlock();

			// 执行目标点的script和事件
			if (!hasTrigger)
				core.trigger(nowx, nowy, callback);

			// 检查该点是否是滑冰
			if (core.onSki()) {
				// 延迟到事件最后执行，因为这之前可能有阻激夹域动画
				core.insertAction({ "type": "moveAction" }, null, null, null, true);
			}

			// ------ 检查目标点事件 END ------ //

			// 如需强行终止行走可以在这里条件判定：
			// core.stopAutomaticRoute();
		},
		"moveDirectly": function (x, y, ignoreSteps) {
			// 瞬间移动；x,y为要瞬间移动的点；ignoreSteps为减少的步数，可能之前已经被计算过
			// 返回true代表成功瞬移，false代表没有成功瞬移

			// 判定能否瞬移到该点
			if (ignoreSteps == null) ignoreSteps = core.canMoveDirectly(x, y);
			if (ignoreSteps >= 0) {
				// 中毒也允许瞬移
				if (core.hasFlag('poison')) {
					var damage = ignoreSteps * core.values.poisonDamage;
					if (damage >= core.status.hero.hp) return false;
					core.status.hero.statistics.poisonDamage += damage;
					core.status.hero.hp -= damage;
				}

				core.clearMap('hero');
				// 获得勇士最后的朝向
				var lastDirection = core.status.route[core.status.route.length - 1];
				if (['left', 'right', 'up', 'down'].indexOf(lastDirection) >= 0)
					core.setHeroLoc('direction', lastDirection);
				// 设置坐标，并绘制
				core.control._moveDirectyFollowers(x, y);
				core.status.hero.loc.x = x;
				core.status.hero.loc.y = y;
				core.drawHero();
				// 记录录像
				core.status.route.push("move:" + x + ":" + y);
				// 统计信息
				core.status.hero.statistics.moveDirectly++;
				core.status.hero.statistics.ignoreSteps += ignoreSteps;
				if (core.hasFlag('poison')) {
					core.updateStatusBar(false, true);
				}
				core.ui.drawStatusBar();
				core.checkRouteFolding();
				return true;
			}
			return false;
		},
		"parallelDo": function (timestamp) {
			// 并行事件处理，可以在这里写任何需要并行处理的脚本或事件
			// 该函数将被系统反复执行，每次执行间隔视浏览器或设备性能而定，一般约为16.6ms一次
			// 参数timestamp为“从游戏资源加载完毕到当前函数执行时”的时间差，以毫秒为单位

			// 检查当前是否处于游戏开始状态
			if (!core.isPlaying()) return;

			// 执行当前楼层的并行事件处理
			if (core.status.floorId) {
				try {
					eval(core.floors[core.status.floorId].parallelDo);
				} catch (e) {
					console.error(e);
				}
			}
		}
	},
	"ui": {
		"getToolboxItems": function (cls) {
			// 获得道具栏中当前某类型道具的显示项和显示顺序
			// cls为道具类型，只可能是 tools, constants 和 equips
			// 返回一个数组，代表当前某类型道具的显示内容和顺序
			// 默认按id升序排列，您可以取消下面的注释改为按名称排列

			return Object.keys(core.status.hero.items[cls] || {})
				.filter(function (id) { return !core.material.items[id].hideInToolbox; })
				.sort( /*function (id1, id2) { return core.material.items[id1].name <= core.material.items[id2].name ? -1 : 1 }*/);
		},
		"drawStatusBar": function () {
			// 这真的是人能写出来的东西？
			var ctx, fill = function (text, x, y, style) {
				core.ui.setFont(ctx, (/\w+/.test(text) ? 'italic ' : '') + 'bold 18px Verdana');
				core.ui.fillBoldText(ctx, text, x, y, style);
			};
			if (core.flags.statusCanvas) { // 系统开关「自绘状态栏」开启
				core.ui.clearMap(ctx = core.dom.statusCanvasCtx); // 清空状态栏
				core.ui.setFillStyle(ctx, core.status.globalAttribute.statusBarColor);
				if (core.domStyle.isVertical) { // 竖屏
					core.drawImage(ctx, core.statusBar.icons.floor, 6, 6, 25, 25);
					fill((core.status.thisMap || {}).name || "Loading", 42, 26);
					core.drawImage(ctx, core.statusBar.icons.hp, 137, 6, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('hp')), 173, 26);
					core.drawImage(ctx, core.statusBar.icons.atk, 268, 6, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('atk')), 304, 26);
					core.drawImage(ctx, core.statusBar.icons.def, 6, 38, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('def')), 42, 58);
					core.drawImage(ctx, core.statusBar.icons.mdef, 137, 38, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('mdef')), 173, 58);
					core.drawImage(ctx, core.statusBar.icons.money, 268, 38, 25, 25);
					fill(core.formatBigNumber(core.status.hero.money), 304, 58);
					core.drawImage(ctx, core.statusBar.icons.exp, 6, 70, 25, 25);
					fill(core.formatBigNumber(core.status.hero.exp), 42, 90);
				} else if (!core.flags.hideLeftStatusBar) { // 横屏且未隐藏状态栏
					core.drawImage(ctx, core.statusBar.icons.floor, 6, 9, 25, 25);
					fill((core.status.thisMap || {}).name || "Loading", 42, 29);
					core.drawImage(ctx, core.statusBar.icons.hp, 6, 43, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('hp')), 42, 63);
					core.drawImage(ctx, core.statusBar.icons.atk, 6, 77, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('atk')), 42, 97);
					core.drawImage(ctx, core.statusBar.icons.def, 6, 111, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('def')), 42, 131);
					core.drawImage(ctx, core.statusBar.icons.mdef, 6, 145, 25, 25);
					fill(core.formatBigNumber(core.getRealStatus('mdef')), 42, 165);
					core.drawImage(ctx, core.statusBar.icons.money, 6, 179, 25, 25);
					fill(core.formatBigNumber(core.status.hero.money), 42, 199);
					core.drawImage(ctx, core.statusBar.icons.exp, 6, 213, 25, 25);
					fill(core.formatBigNumber(core.status.hero.exp), 42, 233);
					fill(core.setTwoDigits(core.itemCount('yellowKey')), 11, 267, '#FFCCAA');
					fill(core.setTwoDigits(core.itemCount('blueKey')), 46, 267, '#AAAADD');
					fill(core.setTwoDigits(core.itemCount('redKey')), 81, 267, '#FF8888');
				}
			} else if (core.flags.hideLeftStatusBar && !core.domStyle.isVertical) { // 横屏且隐藏状态栏
				if (!core.dymCanvas['status'])
					core.ui.createCanvas('status', 0, 0, core._PX_, core._PY_, 66); // 刚好盖过显伤层
				core.ui.clearMap(ctx = core.dymCanvas['status']);
				core.ui.setFillStyle(ctx, core.status.globalAttribute.statusBarColor);
				var offset = core.status.hero.loc.x - core.bigmap.offsetX / 32 >= core._HEIGHT_ ? 0 : core._PY_;
				core.ui.setAlpha(ctx, 0.75);
				core.ui.drawWindowSkin('winskin.png', ctx, offset, 0, core._PX_ - core._PY_, core._PY_);
				core.ui.setAlpha(ctx, 1);
				core.drawImage(ctx, core.statusBar.icons.floor, 6 + offset, 9, 25, 25);
				fill((core.status.thisMap || {}).name || "Loading", 42 + offset, 29);
				core.drawImage(ctx, core.statusBar.icons.hp, 6 + offset, 43, 25, 25);
				fill(core.formatBigNumber(core.getRealStatus('hp')), 42 + offset, 63);
				core.drawImage(ctx, core.statusBar.icons.atk, 6 + offset, 77, 25, 25);
				fill(core.formatBigNumber(core.getRealStatus('atk')), 42 + offset, 97);
				core.drawImage(ctx, core.statusBar.icons.def, 6 + offset, 111, 25, 25);
				fill(core.formatBigNumber(core.getRealStatus('def')), 42 + offset, 131);
				core.drawImage(ctx, core.statusBar.icons.mdef, 6 + offset, 145, 25, 25);
				fill(core.formatBigNumber(core.getRealStatus('mdef')), 42 + offset, 165);
				core.drawImage(ctx, core.statusBar.icons.money, 6 + offset, 179, 25, 25);
				fill(core.formatBigNumber(core.status.hero.money), 42 + offset, 199);
				core.drawImage(ctx, core.statusBar.icons.exp, 6 + offset, 213, 25, 25);
				fill(core.formatBigNumber(core.status.hero.exp), 42 + offset, 233);
				fill(core.setTwoDigits(core.itemCount('yellowKey')), 11 + offset, 267, '#FFCCAA');
				fill(core.setTwoDigits(core.itemCount('blueKey')), 46 + offset, 267, '#AAAADD');
				fill(core.setTwoDigits(core.itemCount('redKey')), 81 + offset, 267, '#FF8888');
			}
		},
		"drawStatistics": function () {
			// 浏览地图时参与的统计项目

			return [
				'yellowDoor', 'blueDoor', 'redDoor', 'greenDoor', 'steelDoor',
				'yellowKey', 'blueKey', 'redKey', 'greenKey', 'steelKey',
				'redGem', 'blueGem', 'greenGem', 'yellowGem',
				'redPotion', 'bluePotion', 'greenPotion', 'yellowPotion', 'superPotion',
				'pickaxe', 'bomb', 'centerFly', 'icePickaxe', 'freezeBadge',
				'earthquake', 'upFly', 'downFly', 'jumpShoes', 'lifeWand',
				'poisonWine', 'weakWine', 'curseWine', 'superWine',
				'sword1', 'sword2', 'sword3', 'sword4', 'sword5',
				'shield1', 'shield2', 'shield3', 'shield4', 'shield5',
				// 在这里可以增加新的ID来进行统计个数，只能增加道具ID
			];
		},
		"drawAbout": function () {
			// 绘制“关于”界面
			core.ui.closePanel();
			core.lockControl();
			core.status.event.id = 'about';

			var left = 48,
				top = 36,
				right = (core._PX_ || core.__PIXELS__) - 2 * left,
				bottom = (core._PY_ || core.__PIXELS__) - 2 * top;

			core.setAlpha('ui', 0.85);
			core.fillRect('ui', left, top, right, bottom, '#000000');
			core.setAlpha('ui', 1);
			core.strokeRect('ui', left - 1, top - 1, right + 1, bottom + 1, '#FFFFFF', 2);

			var text_start = left + 24;

			// 名称
			core.setTextAlign('ui', 'left');
			var globalAttribute = core.status.globalAttribute || core.initStatus.globalAttribute;
			core.fillText('ui', "HTML5 魔塔样板", text_start, top + 35, globalAttribute.selectColor, "bold 22px " + globalAttribute.font);
			core.fillText('ui', "版本： " + main.__VERSION__, text_start, top + 80, "#FFFFFF", "bold 17px " + globalAttribute.font);
			core.fillText('ui', "作者： 艾之葵", text_start, top + 112);
			core.fillText('ui', 'HTML5魔塔交流群：539113091', text_start, top + 112 + 32);
			// TODO: 写自己的“关于”页面，每次增加32像素即可
			core.playSound('打开界面');
		}
	}
}