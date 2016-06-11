//ver1.4.1
//Author: Nishisonic
//        Nekopanda

/*
 * 全画像データを1度だけ全読み込みしてScriptData内に保存
 * そこから毎回取り出すプログラム
 * 表示したデータは、次に表示する際にdispose()して消すか、そのまま表示する
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
HashMap = Java.type("java.util.HashMap");

GlobalContext = Java.type("logbook.data.context.GlobalContext");
AppConstants = Java.type("logbook.constants.AppConstants");
ReportUtils = Java.type("logbook.util.ReportUtils");

//System = Java.type("java.lang.System");

data_prefix = "shipImage_";

//var startTime;
//var endTime;

//画像処理に使う変数類
var oldImageDtoMap = null;
var imageDtoMap    = null;
var oldImageMap    = null;
var imageMap       = null;
var WIDTH          = 80;
var HEIGHT         = 20;

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
			setTmpData("LAYER_" + file.getName(),getImage(file.toString()));
		}
		//通常
		for each(var file in nDir.listFiles(new ImageFilter())){
			setTmpData("NORMAL_" + file.getName(),getImage(file.toString()));
		}
		//損傷
		for each(var file in dDir.listFiles(new ImageFilter())){
			setTmpData("DAMAGE_" + file.getName(),getImage(file.toString()));
		}
		setTmpData("isLoaded",true);
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
	//前回保存したimageDtoのマップ
	oldImageDtoMap  = getData("imageDtoMap");
	//前回保存したimageのマップ
	oldImageMap = getData("imageMap");
	//今回生成するimageDtoのマップ
	imageDtoMap    = new HashMap();
	//今回生成するimageのマップ
	imageMap       = new HashMap();
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

	/* ここから画像処理 */
	/*
	 * ※注意点
	 * 生成したImageをそのままにしていると、その内メモリ不足を引き起こして落ちるので、
	 * どこかでdispose()してメモリを解放する必要がある
	 */

	//今回生成したimageDto
	var imageDto        = getImageDto(ship);
	//今回生成したimage(但しこの時点では作らない、作らない可能性があるので)
	var image;

	//System.out.print("id:" + ship.id + ",name:" + ship.name);
	
	//古いdtoMapが存在する&古いimageMapが存在する&古いdtoMapに艦娘のデータが存在する&古いimageMapに艦娘のデータが存在する場合のみ実行
	if(oldImageDtoMap != null && oldImageMap != null && oldImageDtoMap.containsKey(ship.id.toString()) && oldImageMap.containsKey(ship.id.toString())){
		//前回読み込んだimageDto
		var oldImageDto     = oldImageDtoMap.get(ship.id.toString());
		//前回読み込んだimage
		var oldImage        = oldImageMap.get(ship.id.toString());
		//前回読み込んだimageDtoと今回作ったimageDtoを比較
		if(isEqual(oldImageDto,imageDto)){
			//一緒だった場合は前に作ったimageを読み込む
			//System.out.print(",flg:前回引継");
			image = oldImage;
		} else {
			//System.out.print(",flg:前回廃棄→新規作成");
			//前の画像を廃棄
			oldImage.dispose();
			//再作成
			image = resize(imageDto.imageArray, WIDTH, HEIGHT);
		}
		//前のデータを削除
		oldImageMap.remove(ship.id.toString()); //こっちを使う
		//System.out.print(oldImageMap.remove(ship.id.toString()));
		//oldImageDtoMap.remove(ship.id.toString()); たぶんGCされる
	} else {
		//System.out.print(",flg:完全新規作成");
		image = resize(imageDto.imageArray, WIDTH, HEIGHT);
	}
	

	//画像を貼り付ける
	item.setImage(picIndex, image);

	//保存
	imageDtoMap.put(ship.id.toString(), imageDto);
	imageMap.put(ship.id.toString(), image);
	
	
	//System.out.print(",oldImageDtoMap:" + oldImageDtoMap.size());
	//System.out.print(",imageDtoMap:" + imageDtoMap.size());
	//System.out.print(",oldImageMap:" + oldImageMap.size());
	//System.out.print(",imageMap:" + imageMap.size());
	//System.out.println(",image:" + image);

	return item;
}

function end() {
	//残った分を廃棄   (こうしないとメモリ不足になって落ちる)
	if(oldImageMap != null){
		//print(oldImageMap.size());
		oldImageMap.forEach(function(key,image){
			//print(key,image);
			image.dispose();
		});
	}
	//保存
	setTmpData("imageDtoMap",imageDtoMap);
	setTmpData("imageMap",imageMap);

	//print((System.currentTimeMillis() - startTime) + "ms");
}


function getImageDto(ship){
	var hp;
	var state;
	var _cond;
	var wedding;

	var shipImage = (function(ship){
		//通常
		if(!ship.isHalfDamage()){
			hp = "Normal";
			return getData("NORMAL_" + ship.shipId.toString() + ".jpg");
		//中破以上
		} else {
			hp = "Damage";
			return getData("DAMAGE_" + ship.shipId.toString() + ".jpg");
		}
	})(ship);
	var imageArray = [];
	//撃沈
	if(ship.isSunk()){
		state = "Sunk";
		_cond = "Normal";
		wedding = "Normal";
		imageArray.push(new Image(Display.getDefault(), shipImage, SWT.IMAGE_GRAY));
		imageArray.push(getData("LAYER_Sunk.png"));
	} else {
		imageArray.push(shipImage);
		//修復中
		if(ndockShips.contains(ship.id)){
			state = "Repair";
			imageArray.push(getData("LAYER_Repair.png"));
		//遠征中
		} else if(missionShips.contains(ship.id)){
			state = "Mission";
			imageArray.push(getData("LAYER_Mission.png"));
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				state = "Badly";
				imageArray.push(getData("LAYER_Badly.png"));
				imageArray.push(getData("LAYER_BadlySmoke.png"));
			//中破
			} else if(ship.isHalfDamage()){
				state = "Half";
				imageArray.push(getData("LAYER_Half.png"));
				imageArray.push(getData("LAYER_HalfSmoke.png"));
			//小破
			} else if(ship.isSlightDamage()){
				state = "Slight";
				imageArray.push(getData("LAYER_Slight.png"));
				imageArray.push(getData("LAYER_SlightSmoke.png"));
			} else {
				state = "Normal";
			}
		}

		var cond = ship.getCond();

		//赤疲労
		if(cond < 20){
			_cond = "RedCond";
			imageArray.push(getData("LAYER_RedCond.png"));
		//橙疲労
		} else if(cond < 30){
			_cond = "OrangeCond";
			imageArray.push(getData("LAYER_OrangeCond.png"));
		//キラ
		} else if(cond > 49){
			_cond = "KiraCond";
			imageArray.push(getData("LAYER_KiraCond.png"));
		} else {
			_cond = "Normal";
		}

		//ケッコンカッコカリ
		if(ship.getLv() > 99){
			wedding = "Wedding";
			imageArray.push(getData("LAYER_Wedding.png"));
		} else {
			wedding = "Normal";
		}
	}
	
	return {hp:hp, state:state, cond:_cond, wedding:wedding, imageArray:imageArray};
}

function resize(imageArray,width,height){
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

function isEqual(dto,dto2){
	return dto.hp == dto2.hp && dto.state == dto2.state && dto.cond == dto2.cond && dto.wedding == dto2.wedding;
}