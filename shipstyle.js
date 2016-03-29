/**
 * テーブルのデザインを変えるスクリプト。
 * 
 * @author Nishisonic
 * @author Nekopanda
 * @since 1.0.0
 * @version 1.2.0
 */

//script読み込み
load("script/utils.js");

//Import部分
Image = Java.type("org.eclipse.swt.graphics.Image");
ImageData = Java.type("org.eclipse.swt.graphics.ImageData");
TableItem = Java.type("org.eclipse.swt.widgets.TableItem");
SWT = Java.type("org.eclipse.swt.SWT");
GC = Java.type("org.eclipse.swt.graphics.GC");
Display = Java.type("org.eclipse.swt.widgets.Display");
SWTResourceManager = Java.type("org.eclipse.wb.swt.SWTResourceManager");

GlobalContext = Java.type("logbook.data.context.GlobalContext");
AppConstants = Java.type("logbook.constants.AppConstants");
ReportUtils = Java.type("logbook.util.ReportUtils");

/** 画像の横幅 */
WIDTH  = 80;

/** 画像の縦幅 */
HEIGHT = 20;

/** レイヤーのパス */
LAYER_PATH = {
	SUNK        :".\\script\\shipImage\\Layer\\Sunk.png",
	REPAIR      :".\\script\\shipImage\\Layer\\Repair.png",
	MISSION     :".\\script\\shipImage\\Layer\\Mission.png",
	BADLY       :".\\script\\shipImage\\Layer\\Badly.png",
	BADLY_SMOKE :".\\script\\shipImage\\Layer\\BadlySmoke.png",
	HALF        :".\\script\\shipImage\\Layer\\Half.png",
	HALF_SMOKE  :".\\script\\shipImage\\Layer\\HalfSmoke.png",
	SLIGHT      :".\\script\\shipImage\\Layer\\Slight.png",
	SLIGHT_SMOKE:".\\script\\shipImage\\Layer\\SlightSmoke.png",
	RED_COND    :".\\script\\shipImage\\Layer\\RedCond.png",
	ORANGE_COND :".\\script\\shipImage\\Layer\\OrangeCond.png",
	KIRA_COND   :".\\script\\shipImage\\Layer\\KiraCond.png",
	WEDDING     :".\\script\\shipImage\\Layer\\Wedding.png"
}

/** 疲労の列 */
var condIndex = 12;

/** 画像の列 */
var picIndex = - 1;

/**
 * Override
 * テーブルリロード時に行作成前に呼び出されます。
 * 
 * @param header テーブルのヘッダ(java.lang.String[])
 */
function begin(header) {
	//start = System.currentTimeMillis();
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

/**
 * cond値に合わせて色を返す。
 * 
 * @param cond コンディション値(int)
 */
function getTableCondColor(cond) {
	for (var i = 0; i < AppConstants.COND_TABLE_COLOR.length; ++i) {
		if (cond >= AppConstants.COND_TABLE[i]) {
			return SWTResourceManager.getColor(AppConstants.COND_TABLE_COLOR[i]);
		}
	}
	// 0より小さいってあり得ないけど
	return SWTResourceManager.getColor(AppConstants.COND_RED_COLOR);
}

/**
 * 行作成時に呼び出されます。
 * 
 * @param table テーブル(org.eclipse.swt.widgets.Table)
 * @param data 該当行の項目データ(java.lang.Comparable[])
 * @param index 行番号（上から0始まり）(int)
 * @return 作成したTableItem(org.eclipse.swt.widgets.TableItem)
 */
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

/**
 * テーブルリロード時に行作成が終了したときに呼び出されます。
 */
function end() { }

/**
 * リサイズしたり重ねられた画像を返す。
 * 
 * @param ship 艦娘を表します(logbook.dto.ShipDto)
 * @return 画像(org.eclipse.swt.graphics.Image)
 */
function getFormatImage(ship){
	var imageArray = [];
	
	//撃沈
	if(ship.isSunk()){
		imageArray.push(new Image(Display.getDefault(),getShipImage(ship),SWT.IMAGE_GRAY));
		imageArray.push(getImage(LAYER_PATH.SUNK));
	} else {
		imageArray.push(getShipImage(ship));
		//修復中
		if(ndockShips.contains(ship.id)){
			imageArray.push(getImage(LAYER_PATH.REPAIR));
		//遠征中
		} else if(missionShips.contains(ship.id)){
			imageArray.push(getImage(LAYER_PATH.MISSION));
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				imageArray.push(getImage(LAYER_PATH.BADLY));
				imageArray.push(getImage(LAYER_PATH.BADLY_SMOKE));
			//中破
			} else if(ship.isHalfDamage()){
				imageArray.push(getImage(LAYER_PATH.HALF));
				imageArray.push(getImage(LAYER_PATH.HALF_SMOKE));
			//小破
			} else if(ship.isSlightDamage()){
				imageArray.push(getImage(LAYER_PATH.SLIGHT));
				imageArray.push(getImage(LAYER_PATH.SLIGHT_SMOKE));
			}
		}
		//赤疲労
		if(ship.getCond() < 20) imageArray.push(getImage(LAYER_PATH.RED_COND));
		//橙疲労
		if(ship.getCond() < 30) imageArray.push(getImage(LAYER_PATH.ORANGE_COND));
		//キラ
		if(ship.getCond() > 49) imageArray.push(getImage(LAYER_PATH.KIRA_COND));
		//ケッコンカッコカリ
		if(ship.getLv() > 99) imageArray.push(getImage(LAYER_PATH.WEDDING));
	}
	return mask(imageArray, WIDTH, HEIGHT);
}

/**
 * 艦娘の画像を返す。
 * 
 * @param ship 艦娘を表します(logbook.dto.ShipDto)
 * @return 艦娘の画像(通常、中破どちらかを返す)(org.eclipse.swt.graphics.Image)
 */
function getShipImage(ship){
	//通常
	if(!ship.isHalfDamage()) return getNormalShipImage(ship);
	//中破以上
	return getDamageShipImage(ship);
}

/**
 * 艦娘のidから通常の画像を返します。
 * 
 * @param ship 艦娘を表します(logbook.dto.ShipDto)
 * @return 艦娘の画像(通常)(org.eclipse.swt.graphics.Image)
 */
function getNormalShipImage(ship){
	return getImage(".\\script\\shipImage\\Normal\\" + ship.shipId + ".jpg");
}

/**
 * 艦娘のidから中破の画像を返します。
 * 
 * @param ship 艦娘を表します(logbook.dto.ShipDto)
 * @return 艦娘の画像(中破)(org.eclipse.swt.graphics.Image)
 */
function getDamageShipImage(ship){
	return getImage(".\\script\\shipImage\\Damage\\" + ship.shipId + ".jpg");
}

/**
 * 重ねた画像を返す。
 * 
 * @param imageArray Imageの配列(org.eclipse.swt.graphics.Image[])
 * @param width 横幅(int)
 * @param height 縦幅(int)
 * @return 重ねられた画像(org.eclipse.swt.graphics.Image)
 */
function mask(imageArray, width, height){
	var scaled = new Image(Display.getDefault(), width, height);
	var gc = new GC(scaled);
	gc.setAntialias(SWT.ON);
	gc.setInterpolation(SWT.HIGH);
	for each(var image in imageArray){
		gc.drawImage(image, 0, 0, image.getBounds().width, image.getBounds().height, 0, 0, width, height);
		image.dispose();
	}
	gc.dispose();
	return scaled;
}

/**
 * SWTのImageを返す。
 * 
 * @param パス(java.lang.String)
 * @return 画像(org.eclipse.swt.graphics.Image)
 */
function getImage(path){
	return new Image(Display.getDefault(), path);
}
