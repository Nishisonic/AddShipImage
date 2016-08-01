//ver1.5.1
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
Arrays = Java.type("java.util.Arrays");
Map = Java.type("java.util.Map");
LinkedHashSet = Java.type("java.util.LinkedHashSet"); 
URL = Java.type("java.net.URL");
HttpURLConnection = Java.type("java.net.HttpURLConnection");
Files = Java.type("java.nio.file.Files");
Paths = Java.type("java.nio.file.Paths");

GlobalContext = Java.type("logbook.data.context.GlobalContext");
AppConstants = Java.type("logbook.constants.AppConstants");
ReportUtils = Java.type("logbook.util.ReportUtils");
ApplicationMain = Java.type("logbook.gui.ApplicationMain");

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
var PREFIX         = "";
var FS             = File.separator;
var DIR            = "." + FS + "script" + FS + "shipImage" + FS;
var lDir           = new File(DIR + "Layer");
var nDir           = new File(DIR + "Normal");
var dDir           = new File(DIR + "Damage");
var tableImageDto  = null;
var shipTable      = null;

var condIndex = 12;
//画像
var picIndex = - 1;

var columnIndex = - 1;

function begin(header) {
	//startTime = System.currentTimeMillis();
	if(!getData("isLoaded")){ //nullはfalse
		//レイヤー
		Arrays.stream(lDir.listFiles(new ImageFilter())).forEach(function(file){
			setTmpData("LAYER_" + file.getName(),getImage(file.toString()));
		});
		//通常
		Arrays.stream(nDir.listFiles(new ImageFilter())).forEach(function(file){
			setTmpData("NORMAL_" + file.getName(),getImage(file.toString()));
		});
		//損傷
		Arrays.stream(dDir.listFiles(new ImageFilter())).forEach(function(file){
			setTmpData("DAMAGE_" + file.getName(),getImage(file.toString()));
		});
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

	if(index == 0){
		//メモリをキー代わりにしてみる(GCされた場合、SWTExceptionが起きそう)
		Arrays.stream(ApplicationMain.main.getShipTables()).filter(function(shiptable){
			return shiptable.shell == table.shell;
		}).forEach(function(shiptable){
			shipTable = shiptable;
		});
		//お風呂に入りたい艦娘
		var bathWaterTableDialog = ApplicationMain.main.getBathwaterTableDialog();
		if(bathWaterTableDialog.shell == table.shell){
			shipTable = bathWaterTableDialog;
		}
		//前回保存したimageのマップのマップ
		var storedTableImageDto = getData(shipTable);
		tableImageDto = storedTableImageDto instanceof Map ? storedTableImageDto : new HashMap();
		//前回保存したimageDtoのマップ
		oldImageDtoMap = tableImageDto.containsKey("imageDtoMap") ? tableImageDto.get("imageDtoMap") : new HashMap();
		//前回保存したimageのマップ
		oldImageMap    = tableImageDto.containsKey("imageMap") ? tableImageDto.get("imageMap") : new HashMap();
		//今回生成するimageDtoのマップ
		imageDtoMap    = new HashMap();
		//今回生成するimageのマップ
		imageMap       = new HashMap();
	}

	//今回生成したimageDto
	var imageDto        = getImageDto(ship);
	//今回生成したimage(但しこの時点では作らない、作らない可能性があるので)
	var image;
	
	//古いdtoMapに艦娘のデータが存在する&古いimageMapに艦娘のデータが存在する場合のみ実行
	if(oldImageDtoMap.containsKey(ship.id.toString()) && oldImageMap.containsKey(ship.id.toString())){
		//前回読み込んだimageDto
		var oldImageDto     = oldImageDtoMap.get(ship.id.toString());
		//前回読み込んだimage
		var oldImage        = oldImageMap.get(ship.id.toString());
		//前回読み込んだimageDtoと今回作ったimageDtoを比較
		//Ver1.4.2:廃棄されているかも確認する
		if(isEqual(oldImageDto,imageDto) && !oldImage.isDisposed()){
			//一緒だった場合は前に作ったimageを読み込む
			image = oldImage;
		} else {
			//前の画像を廃棄
			oldImage.dispose();
			//再作成
			image = resize(imageDto.imageSet, WIDTH, HEIGHT);
		}
		//前のデータを削除
		oldImageMap.remove(ship.id.toString());
		oldImageDtoMap.remove(ship.id.toString());
	} else {
		image = resize(imageDto.imageSet, WIDTH, HEIGHT);
	}

	//画像を貼り付ける
	item.setImage(picIndex, image);

	//保存
	imageDtoMap.put(ship.id.toString(), imageDto);
	imageMap.put(ship.id.toString(), image);

	return item;
}

function end() {
	//残った分を廃棄   (こうしないとメモリ不足になって落ちる)
	oldImageMap.forEach(function(key,image){
		image.dispose();
	});
	//保存
	tableImageDto.put("imageDtoMap", imageDtoMap);
	tableImageDto.put("imageMap", imageMap);

	setTmpData(shipTable, tableImageDto);
	
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
			return getData("NORMAL_" + ship.shipId.toString() + ".jpg") instanceof Image ? getData("NORMAL_" + ship.shipId.toString() + ".jpg") : getWebImage(ship.shipId.toString(), false);
		//中破以上
		} else {
			hp = "Damage";
			return getData("DAMAGE_" + ship.shipId.toString() + ".jpg") instanceof Image ? getData("DAMAGE_" + ship.shipId.toString() + ".jpg") : getWebImage(ship.shipId.toString(), true);
		}
	})(ship);
	var imageSet = new LinkedHashSet();
	//撃沈
	if(ship.isSunk()){
		state = "Sunk";
		_cond = "Normal";
		wedding = "Normal";
		imageSet.add(new Image(Display.getDefault(), shipImage, SWT.IMAGE_GRAY));
		imageSet.add(getData("LAYER_Sunk.png"));
	} else {
		imageSet.add(shipImage);
		//修復中
		if(ndockShips.contains(ship.id)){
			state = "Repair";
			imageSet.add(getData("LAYER_Repair.png"));
		//遠征中
		} else if(missionShips.contains(ship.id)){
			state = "Mission";
			imageSet.add(getData("LAYER_Mission.png"));
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				state = "Badly";
				imageSet.add(getData("LAYER_Badly.png"));
				imageSet.add(getData("LAYER_BadlySmoke.png"));
			//中破
			} else if(ship.isHalfDamage()){
				state = "Half";
				imageSet.add(getData("LAYER_Half.png"));
				imageSet.add(getData("LAYER_HalfSmoke.png"));
			//小破
			} else if(ship.isSlightDamage()){
				state = "Slight";
				imageSet.add(getData("LAYER_Slight.png"));
				imageSet.add(getData("LAYER_SlightSmoke.png"));
			} else {
				state = "Normal";
			}
		}

		var cond = ship.cond;

		//赤疲労
		if(cond < 20){
			_cond = "RedCond";
			imageSet.add(getData("LAYER_RedCond.png"));
		//橙疲労
		} else if(cond < 30){
			_cond = "OrangeCond";
			imageSet.add(getData("LAYER_OrangeCond.png"));
		//キラ
		} else if(cond > 49){
			_cond = "KiraCond";
			imageSet.add(getData("LAYER_KiraCond.png"));
		} else {
			_cond = "Normal";
		}

		//ケッコンカッコカリ
		if(ship.getLv() > 99){
			wedding = "Wedding";
			imageSet.add(getData("LAYER_Wedding.png"));
		} else {
			wedding = "Normal";
		}
	}
	
	return {hp:hp, state:state, cond:_cond, wedding:wedding, imageSet:imageSet};
}

function resize(imageSet,width,height){
	var scaled = new Image(Display.getDefault(), width, height);
	var gc = new GC(scaled);
	gc.setAntialias(SWT.ON);
	gc.setInterpolation(SWT.HIGH);
	imageSet.forEach(function(image){
		gc.drawImage(image, 0, 0, image.getBounds().width, image.getBounds().height, 0, 0, width, height);
	});
	gc.dispose();
	return scaled;
}

var ImageFilter = Java.extend(FilenameFilter,{
	accept : function(dir,name){
		var index = name.lastIndexOf(".");
		var ext = name.substring(index+1).toLowerCase();
		//画像
		return ext.equals("jpg") || name.equals("jpeg") || name.endsWith("png");
	}
});

function getImage(path){
	return new Image(Display.getDefault(), path);
}

function isEqual(dto,dto2){
	return dto.hp == dto2.hp && dto.state == dto2.state && dto.cond == dto2.cond && dto.wedding == dto2.wedding;
}

function getWebImage(shipId,isDamaged){
	// githubに接続
	print("SHIP ID:" + shipId + "のデータを取得します...");
	try{
		var url = new URL("https://raw.githubusercontent.com/Nishisonic/AddShipImage/master/shipImage/" + (isDamaged ? "Damage" : "Normal") + "/" + shipId + ".jpg");
		print("接続先:" + url.toString());
		var urlConnection= HttpURLConnection.class.cast(url.openConnection());
		urlConnection.connect();
		print("HTTP Status Code:" + urlConnection.getResponseCode());
		if(urlConnection.getResponseCode() == HttpURLConnection.HTTP_OK){
			var file = Paths.get((isDamaged ? dDir.toString() : nDir.toString()) + FS + shipId + ".jpg");
			//元からファイルが無い前提なので上書き設定は無し
			Files.copy(urlConnection.getInputStream(), file);
			print("画像の取得が完了しました");
			setTmpData((isDamaged ? "DAMAGE_" : "NORMAL_") + shipId + ".jpg", getImage(file.toString()));
			return getData((isDamaged ? "DAMAGE_" : "NORMAL_") + shipId + ".jpg");
		} else {
			print("画像の取得に失敗しました");
			if(urlConnection.getResponseCode() == HttpURLConnection.HTTP_NOT_FOUND){
				print("作者の怠慢によってファイルが置かれていません…作者に問い合わせてください");
			} else {
				print("想定外のエラーです");
			}
		}
	} catch(e) {
		e.printStackTrace();
	}
	return null;
}