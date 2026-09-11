import type { TIconName } from './icon-map.types';
import { IconName } from './icon-map.types';

export const InventoryIconCategory = {
	Appliances: 'Appliances',
	Bathroom: 'Bathroom',
	BedroomLinens: 'Bedroom & Linens',
	CleaningLaundry: 'Cleaning & Laundry',
	FurnitureDecor: 'Furniture & Decor',
	KitchenDining: 'Kitchen & Dining',
	SafetyMaintenance: 'Safety & Maintenance',
} as const;

export type TInventoryIconCategory =
	(typeof InventoryIconCategory)[keyof typeof InventoryIconCategory];

export interface IInventoryIconOption {
	name: TIconName;
	label: string;
	category: TInventoryIconCategory;
}

export const inventoryIconOptions = [
	{
		name: IconName.AirConditioner,
		label: 'Air Conditioner',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Fan,
		label: 'Fan',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Microwave,
		label: 'Microwave',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Oven,
		label: 'Oven',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Refrigerator,
		label: 'Refrigerator',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Washer,
		label: 'Washer',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.WashingMachine,
		label: 'Washing Machine',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Dryer,
		label: 'Dryer',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.DryerHeat,
		label: 'Heated Dryer',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Television,
		label: 'Television',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Remote,
		label: 'Remote',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Speakers,
		label: 'Speakers',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Router,
		label: 'Router',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Outlet,
		label: 'Outlet',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Bath,
		label: 'Bath',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Bathtub,
		label: 'Bathtub',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Shower,
		label: 'Shower',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.ShowerAlt,
		label: 'Shower Head',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Toilet,
		label: 'Toilet',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.ToiletPaper,
		label: 'Toilet Paper',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.ToiletPaperReverse,
		label: 'Toilet Paper Reverse',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Toothbrush,
		label: 'Toothbrush',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.PumpSoap,
		label: 'Soap Dispenser',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Soap,
		label: 'Soap',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Sink,
		label: 'Sink',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Faucet,
		label: 'Faucet',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.FaucetDrip,
		label: 'Faucet Drip',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.BoxTissue,
		label: 'Tissue Box',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Bed,
		label: 'Bed',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.BedAlt,
		label: 'Bed Alternate',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.BedBunk,
		label: 'Bunk Bed',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.BedEmpty,
		label: 'Bed Empty',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.Blanket,
		label: 'Blanket',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.MattressPillow,
		label: 'Pillow / Bedding',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.ClothesHanger,
		label: 'Clothes Hanger',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.Broom,
		label: 'Broom',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.Bucket,
		label: 'Bucket',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.JugDetergent,
		label: 'Detergent',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.SprayCan,
		label: 'Spray Can',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.Trash,
		label: 'Trash',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.TrashCan,
		label: 'Trash Can',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.Recycle,
		label: 'Recycle',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.BinRecycle,
		label: 'Bin Recycle',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.Vacuum,
		label: 'Vacuum',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.VacuumRobot,
		label: 'Vacuum Robot',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.Couch,
		label: 'Couch',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Loveseat,
		label: 'Loveseat',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Chair,
		label: 'Chair',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.ChairOffice,
		label: 'Chair Office',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Stool,
		label: 'Stool',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Table,
		label: 'Table',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.TableDining,
		label: 'Table Dining',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.TablePicnic,
		label: 'Picnic Table',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Lamp,
		label: 'Lamp',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.LampDesk,
		label: 'Lamp Desk',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.LampFloor,
		label: 'Lamp Floor',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Rug,
		label: 'Rug',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Dresser,
		label: 'Dresser',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Shelves,
		label: 'Shelves',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.WindowAlt,
		label: 'Window Alt',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.BasketShopping,
		label: 'Basket',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Blender,
		label: 'Blender',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BottleBaby,
		label: 'Bottle Baby',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BottleWater,
		label: 'Bottle Water',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlChopsticks,
		label: 'Bowl Chopsticks',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlChopsticksNoodles,
		label: 'Bowl Chopsticks Noodles',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlFood,
		label: 'Bowl Food',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlSalad,
		label: 'Bowl Salad',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlSpoon,
		label: 'Bowl Spoon',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.ChampagneGlass,
		label: 'Champagne Glass',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Coffee,
		label: 'Coffee',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CoffeeBeans,
		label: 'Coffee Beans',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CoffeePot,
		label: 'Coffee Pot',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CoffeeTogo,
		label: 'Coffee Togo',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CupStraw,
		label: 'Cup With Straw',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Fork,
		label: 'Fork',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.ForkKnife,
		label: 'Fork and Knife',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Glass,
		label: 'Glass',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Knife,
		label: 'Knife',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.KnifeKitchen,
		label: 'Knife Kitchen',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.KitchenSet,
		label: 'Kitchen Set',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Mug,
		label: 'Mug',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.MugHot,
		label: 'Mug Hot',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.MugSaucer,
		label: 'Mug Saucer',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.PlateUtensils,
		label: 'Plate and Utensils',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Spoon,
		label: 'Spoon',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.Utensils,
		label: 'Utensils',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.WineBottle,
		label: 'Wine Bottle',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.WineGlass,
		label: 'Wine Glass',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BatteryHalf,
		label: 'Battery Half',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.FireExtinguisher,
		label: 'Fire Extinguisher',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.FirstAid,
		label: 'First Aid',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Flashlight,
		label: 'Flashlight',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Hose,
		label: 'Hose',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.HoseReel,
		label: 'Hose Reel',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Key,
		label: 'Key',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.LightSwitch,
		label: 'Light Switch',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.LightSwitchOff,
		label: 'Light Switch Off',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.LightSwitchOn,
		label: 'Light Switch On',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Lightbulb,
		label: 'Lightbulb',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.LightbulbOn,
		label: 'Lightbulb On',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Lock,
		label: 'Lock',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Medkit,
		label: 'Medkit',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Sprinkler,
		label: 'Sprinkler',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.SprinklerCeiling,
		label: 'Sprinkler Ceiling',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.TemperatureHalf,
		label: 'Temperature Gauge',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Toolbox,
		label: 'Toolbox',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Tools,
		label: 'Tools',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Wrench,
		label: 'Wrench',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.WifiStrong,
		label: 'Wi-Fi',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.AirFreshener,
		label: 'Air Freshener',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.ToiletPaperSlash,
		label: 'Toilet Paper Out',
		category: InventoryIconCategory.Bathroom,
	},
	{
		name: IconName.Baby,
		label: 'Baby Supplies',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.BabyCarriage,
		label: 'Baby Carriage',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.SheetPlastic,
		label: 'Sheet / Plastic Cover',
		category: InventoryIconCategory.BedroomLinens,
	},
	{
		name: IconName.Brush,
		label: 'Brush',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.BinBottles,
		label: 'Bottle Bin',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.BinBottlesRecycle,
		label: 'Bottle Recycling Bin',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.BottleDroplet,
		label: 'Bottle Droplet',
		category: InventoryIconCategory.CleaningLaundry,
	},
	{
		name: IconName.BagShopping,
		label: 'Shopping Bag',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BagsShopping,
		label: 'Shopping Bags',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlHot,
		label: 'Hot Bowl',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BowlRice,
		label: 'Rice Bowl',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CanFood,
		label: 'Canned Food',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.CartShopping,
		label: 'Shopping Cart',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.PanFood,
		label: 'Food Pan',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.PanFrying,
		label: 'Frying Pan',
		category: InventoryIconCategory.KitchenDining,
	},
	{
		name: IconName.BasketShoppingSimple,
		label: 'Storage Basket',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.BoxOpen,
		label: 'Open Box',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.BoxesStacked,
		label: 'Stacked Boxes',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.CabinetFiling,
		label: 'Cabinet',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Clock,
		label: 'Clock',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.DoorClosed,
		label: 'Door Closed',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.DoorOpen,
		label: 'Door Open',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.Suitcase,
		label: 'Suitcase',
		category: InventoryIconCategory.FurnitureDecor,
	},
	{
		name: IconName.AlarmClock,
		label: 'Alarm Clock',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.BatteryFull,
		label: 'Battery Full',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.BatteryQuarter,
		label: 'Battery Quarter',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.CameraCctv,
		label: 'CCTV Camera',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.CameraSecurity,
		label: 'Security Camera',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.KeySkeleton,
		label: 'Skeleton Key',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.SensorFire,
		label: 'Fire Sensor',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.SensorSmoke,
		label: 'Smoke Sensor',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.SmokingBan,
		label: 'No Smoking Sign',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.SquareParking,
		label: 'Parking Sign',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Screwdriver,
		label: 'Screwdriver',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.ScrewdriverWrench,
		label: 'Screwdriver and Wrench',
		category: InventoryIconCategory.SafetyMaintenance,
	},
	{
		name: IconName.Camera,
		label: 'Camera',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.FanTable,
		label: 'Table Fan',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.FireBurner,
		label: 'Stove Burner',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Grill,
		label: 'Grill',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.GrillHot,
		label: 'Hot Grill',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Heat,
		label: 'Heat',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.Plug,
		label: 'Plug',
		category: InventoryIconCategory.Appliances,
	},
	{
		name: IconName.PowerOff,
		label: 'Power Button',
		category: InventoryIconCategory.Appliances,
	},
] as const satisfies readonly IInventoryIconOption[];

export const inventoryIconNames = inventoryIconOptions.map(
	(inventoryIconOption) => inventoryIconOption.name,
) as readonly TIconName[];

export type TInventoryIconName = (typeof inventoryIconOptions)[number]['name'];
