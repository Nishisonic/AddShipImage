//ver1.3.0
//Author: Nishisonic
//        Nekopanda

/*
 * 全画像データを1度だけ全読み込みしてScriptData内に保存
 * そこから毎回取り出すプログラム
 * 表示したデータは、次に表示する際にdispose()して消す
 */

load("script/utils.js");
load("script/ScriptData.js");

Image = Java.type("org.eclipse.swt.graphics.Image");
File = Java.type("java.io.File");
FilenameFilter = Java.type("java.io.FilenameFilter");
TableItem = Java.type("org.eclipse.swt.widgets.TableItem");
SWT = Java.type("org.eclipse.swt.SWT");
GC = Java.type("org.eclipse.swt.graphics.GC");
Display = Java.type("org.eclipse.swt.widgets.Display");
SWTResourceManager = Java.type("org.eclipse.wb.swt.SWTResourceManager");
ImageData = Java.type("org.eclipse.swt.graphics.ImageData");

GlobalContext = Java.type("logbook.data.context.GlobalContext");
AppConstants = Java.type("logbook.constants.AppConstants");
ReportUtils = Java.type("logbook.util.ReportUtils");

//System = Java.type("java.lang.System");

data_prefix = "shipImage_";

//var LAYER_IMAGE = [];
//var NORMAL_SHIP_IMAGE = [];
//var DAMAGE_SHIP_IMAGE = [];
//var isLoaded = false;

//var startTime;
//var endTime;

var oldData = [];

var condIndex = 12;
//画像
var picIndex = - 1;

var columnIndex = - 1;

function begin(header) {
	//startTime = System.currentTimeMillis();
	if(getData("isLoaded") == null){
		var lDir = new File(".\\script\\shipImage\\Layer");
		var nDir = new File(".\\script\\shipImage\\Normal");
		var dDir = new File(".\\script\\shipImage\\Damage");
		//レイヤー
		for each(var file in lDir.listFiles(new ImageFilter())){
			//LAYER_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
			setTmpData("LAYER_" + file.getName(),getImage(file.toString()));
			//print("LAYER_" + file.getName());
		}
		//通常
		for each(var file in nDir.listFiles(new ImageFilter())){
			//NORMAL_SHIP_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
			setTmpData("NORMAL_" + file.getName(),getImage(file.toString()));
			//print("NORMAL_" + file.getName());
		}
		//損傷
		for each(var file in dDir.listFiles(new ImageFilter())){
			//DAMAGE_SHIP_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
			setTmpData("DAMAGE_" + file.getName(),getImage(file.toString()));
			//print("DAMAGE_" + file.getName());
		}
		setTmpData("isLoaded",true);
	} else {
		//前に読みだしたデータをdispose()して消す
		var _oldData = getData("oldData");
		if(_oldData != null){
			for each(var data in _oldData) data.dispose();
		}
	}
	missionShips = GlobalContext.getMissionShipSet();
	ndockShips = GlobalContext.getNDockShipSet();
	for (var i = 0; i < header.length; ++i) {
		if (header[i].equals("疲労")) {
			condIndex = i;
		}
		//画像
		if (header[i].equals("画像")) {
			picIndex = i;
		}
	}
}

function getTableCondColor(cond) {
	for (var i = 0; i < AppConstants.COND_TABLE_COLOR.length; ++i) {
		if (cond >= AppConstants.COND_TABLE[i]) {
			return SWTResourceManager.getColor(AppConstants.COND_TABLE_COLOR[i]);
		}
	}
	// 0より小さいってあり得ないけど
	return SWTResourceManager.getColor(AppConstants.COND_RED_COLOR);
}

function create(table, data, index) {
	// 艦娘
	var ship = data[0].get();
	
	var item = new TableItem(table, SWT.NONE);

	item.setData(ship);

	// 偶数行に背景色を付ける
	if ((index % 2) != 0) {
		item.setBackground(SWTResourceManager.getColor(AppConstants.ROW_BACKGROUND));
	}

	// 疲労
	item.setBackground(condIndex, getTableCondColor(ship.cond));

	// 遠征
	if (missionShips.contains(ship.id)) {
		item.setForeground(SWTResourceManager.getColor(AppConstants.MISSION_COLOR));
	}
	// 入渠
	if (ndockShips.contains(ship.id)) {
		item.setForeground(SWTResourceManager.getColor(AppConstants.NDOCK_COLOR));
	}
	// Lv1の艦娘をグレー色にする
	/* ちょっとこれをやる意味がよく分からないのでコメントアウト
	if (ship.getLv() == 1) {
		item.setForeground(SWTResourceManager.getColor(SWT.COLOR_DARK_GRAY));
	}
	*/
	item.setText(ReportUtils.toStringArray(data));

	var image = getFormatImage(ship);

	item.setImage(picIndex, image);
	
	oldData.push(image);
	
	return item;
}

function end() {
	//dispose()をして、メモリを空ける
	//for each(var image in LAYER_IMAGE)       image.dispose();
	//for each(var image in NORMAL_SHIP_IMAGE) image.dispose();
	//for each(var image in DAMAGE_SHIP_IMAGE) image.dispose();
	setTmpData("oldData",oldData);
	//print((System.currentTimeMillis() - startTime) + "ms");
}

function getFormatImage(ship){
	var shipImage = (function(ship){
		//通常
		if(!ship.isHalfDamage()) return getData("NORMAL_" + ship.shipId.toString() + ".jpg");
		//中破以上
		return getData("DAMAGE_" + ship.shipId.toString() + ".jpg");
	})(ship);
	var imageArray = [];
	var width = 80;
	var height = 20;
	//撃沈
	if(ship.isSunk()){
		imageArray.push(new Image(Display.getDefault(), shipImage, SWT.IMAGE_GRAY));
		//imageArray.push(LAYER_IMAGE["Sunk"]);
		imageArray.push(getData("LAYER_Sunk.png"));
	} else {
		imageArray.push(shipImage);
		//修復中
		if(ndockShips.contains(ship.id)){
			//imageArray.push(LAYER_IMAGE["Repair"]);
			imageArray.push(getData("LAYER_Repair.png"));
		//遠征中
		} else if(missionShips.contains(ship.id)){
			//imageArray.push(LAYER_IMAGE["Mission"]);
			imageArray.push(getData("LAYER_Mission.png"));
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				//imageArray.push(LAYER_IMAGE["Badly"]);
				imageArray.push(getData("LAYER_Badly.png"));
				//imageArray.push(LAYER_IMAGE["BadlySmoke"]);
				imageArray.push(getData("LAYER_BadlySmoke.png"));
			//中破
			} else if(ship.isHalfDamage()){
				//imageArray.push(LAYER_IMAGE["Half"]);
				imageArray.push(getData("LAYER_Half.png"));
				//imageArray.push(LAYER_IMAGE["HalfSmoke"]);
				imageArray.push(getData("LAYER_HalfSmoke.png"));
			//小破
			} else if(ship.isSlightDamage()){
				//imageArray.push(LAYER_IMAGE["Slight"]);
				imageArray.push(getData("LAYER_Slight.png"));
				//imageArray.push(LAYER_IMAGE["SlightSmoke"]);
				imageArray.push(getData("LAYER_SlightSmoke.png"));
			}
		}
		//赤疲労
		if(ship.getCond() < 20) /*imageArray.push(LAYER_IMAGE["RedCond"]);    */ imageArray.push(getData("LAYER_RedCond.png"));
		//橙疲労
		if(ship.getCond() < 30) /*imageArray.push(LAYER_IMAGE["OrangeCond"]); */ imageArray.push(getData("LAYER_OrangeCond.png"));
		//キラ
		if(ship.getCond() > 49) /*imageArray.push(LAYER_IMAGE["KiraCond"]);   */ imageArray.push(getData("LAYER_KiraCond.png"));
		//ケッコンカッコカリ
		if(ship.getLv() > 99)   /*imageArray.push(LAYER_IMAGE["Wedding"]);    */ imageArray.push(getData("LAYER_Wedding.png"));
	}
	//for each(var image in imageArray) print(image);
	return reSize(imageArray,width,height);
}

function reSize(imageArray,width,height){
	var scaled = new Image(Display.getDefault(), width, height);
	var gc = new GC(scaled);
	gc.setAntialias(SWT.ON);
	gc.setInterpolation(SWT.HIGH);
	for each(var image in imageArray){
		gc.drawImage(image, 0, 0, image.getBounds().width, image.getBounds().height, 0, 0, width, height);
	}
	gc.dispose();
	return scaled;
}

function getPreffix(fileName) {
	if (fileName == null){
		return null;
	}
	var point = fileName.lastIndexOf(".");
	if (point != -1) {
		return fileName.substring(0, point);
	}
	return fileName;
}

var ImageFilter = Java.extend(FilenameFilter,{
	accept : function(dir,name){
		var index = name.lastIndexOf(".");
		var ext = name.substring(index+1).toLowerCase();
		//画像
		if(ext.equals("jpg") || name.equals("jpeg") || name.endsWith("png")){
			return true;
		}
		return false;
	}
});

function getImage(path){
	return new Image(Display.getDefault(), path);
}
