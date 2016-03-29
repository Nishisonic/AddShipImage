//ver1.1.0
//Author: Nishisonic
//        Nekopanda

load("script/utils.js");

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

LAYER_IMAGE = [];
NORMAL_SHIP_IMAGE = [];
DAMAGE_SHIP_IMAGE = [];

//var start;
//var end;

var condIndex = 12;
//画像
var picIndex = - 1;

var columnIndex = - 1;

function begin(header) {
	//start = System.currentTimeMillis();
	var lDir = new File(".\\script\\shipImage\\Layer");
	var nDir = new File(".\\script\\shipImage\\Normal");
	var dDir = new File(".\\script\\shipImage\\Damage");
	//レイヤー
	for each(var file in lDir.listFiles(new ImageFilter())){
		LAYER_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
	}
	//通常
	for each(var file in nDir.listFiles(new ImageFilter())){
		NORMAL_SHIP_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
	}
	//損傷
	for each(var file in dDir.listFiles(new ImageFilter())){
		DAMAGE_SHIP_IMAGE[getPreffix(file.getName())] = getImage(file.toString());
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

	item.setImage(picIndex,getFormatImage(ship));

	return item;
}

function end() {
	//dispose()をして、メモリを空ける
	for each(var image in LAYER_IMAGE)       image.dispose();
	for each(var image in NORMAL_SHIP_IMAGE) image.dispose();
	for each(var image in DAMAGE_SHIP_IMAGE) image.dispose();
	//end = System.currentTimeMillis();
	//print((end - start)  + "ms");
}

function getFormatImage(ship){
	var imageArray = [];
	var width = 80;
	var height = 20;
	//撃沈
	if(ship.isSunk()){
		imageArray.push(monochrome(getShipImage(ship)));
		imageArray.push(LAYER_IMAGE["Sunk"]);
	} else {
		imageArray.push(getShipImage(ship));
		//修復中
		if(ndockShips.contains(ship.id)){
			imageArray.push(LAYER_IMAGE["Repair"]);
		//遠征中
		} else if(missionShips.contains(ship.id)){
			imageArray.push(LAYER_IMAGE["Mission"]);
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				imageArray.push(LAYER_IMAGE["Badly"]);
				imageArray.push(LAYER_IMAGE["BadlySmoke"]);
			//中破
			} else if(ship.isHalfDamage()){
				imageArray.push(LAYER_IMAGE["Half"]);
				imageArray.push(LAYER_IMAGE["HalfSmoke"]);
			//小破
			} else if(ship.isSlightDamage()){
				imageArray.push(LAYER_IMAGE["Slight"]);
				imageArray.push(LAYER_IMAGE["SlightSmoke"]);
			}
		}
		//赤疲労
		if(ship.getCond() < 20) imageArray.push(LAYER_IMAGE["RedCond"]);
		//橙疲労
		if(ship.getCond() < 30) imageArray.push(LAYER_IMAGE["OrangeCond"]);
		//キラ
		if(ship.getCond() > 49) imageArray.push(LAYER_IMAGE["KiraCond"]);
		//ケッコンカッコカリ
		if(ship.getLv() > 99) imageArray.push(LAYER_IMAGE["Wedding"]);
	}
	return reSize(imageArray,width,height);
}

function getShipImage(ship){
	//通常
	if(!ship.isHalfDamage()) return NORMAL_SHIP_IMAGE[ship.shipId.toString()];
	//中破以上
	return DAMAGE_SHIP_IMAGE[ship.shipId.toString()];
}

function reSize(imageArray,width,height){
	var scaled = new Image(Display.getDefault(), width, height);
	var gc = new GC(scaled);
	gc.setAntialias(SWT.ON);
	gc.setInterpolation(SWT.HIGH);
	for(var i = 0;i < imageArray.length;i++){
		gc.drawImage(imageArray[i], 0, 0, imageArray[i].getBounds().width, imageArray[i].getBounds().height, 0, 0, width, height);
	}
	gc.dispose();
	return scaled;
}

function monochrome(image){
	// 画像処理用データ取得
	// Imageのままでは画素取得とか出来ないので……
	var id = image.getImageData();

	// 画像のサイズ取得
	var width  = id.width;
	var height = id.height;
	
	// 新しい画像（の中身）を作る
	// こっちを編集する
	var idmono = new ImageData(width, height, id.depth, id.palette);

	// それぞれ、Colour、Red、Green、Blue、Monochromeの略
	var c, r, g, b, m;

	// 画素を一つ一つ取得し、順次処理
	for (var x = 0; x < width; ++x) {
		for (var y = 0; y < height; ++y) {
			// 画素を取得し、RGBに分解する
			c = id.getPixel(x, y);
			r =  c        & 0xff;
			g = (c >> 8 ) & 0xff;
			b = (c >> 16) & 0xff;

			// モノクロに用いる色を生成
			// cを使い回していることに注意
			m = Math.round((r + g + b)/3);
			if (m > 255) m = 255;
			else if (m < 0) m = 0;
			c = (m << 16) + (m << 8) + m;

			// 生成した色を収める
			idmono.setPixel(x, y, c);
		}
	}

	var monoImage = new Image(null, idmono);
	return monoImage;
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
