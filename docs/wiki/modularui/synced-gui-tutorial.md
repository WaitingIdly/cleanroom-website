---
title: Synced GUI Tutorial
---

# Synced gui tutorial

First you need to decide how you want to open the GUI. Through a right click on a block or by right clicking an item?
ModularUI has helpers for both of those cases, but you can also implement custom behaviour if that's needed.

In this tutorial we will open a GUI on right clicking a block.

## Creating the Block

At the top we subscribe to some events to register the block and the item form.
Whats interesting for us is the method at the bottom `onBlockActivated()`. This is called when the block is right clicked.
Inside we first check if the method is called on server side. This is important. **Synced GUI's MUST be opened ONLY from
server side!**. Then we simply call `GuiFactories.tileEntity().open(playerIn, pos);`. This will find the tile entity
at the blocks position and tries to open the GUI on client and server side.

```java
public class TutorialBlock extends Block implements ITileEntityProvider {

    public static final Block testBlock = new TutorialBlock();
    public static final ItemBlock testItemBlock = new ItemBlock(testBlock);

    public static void preInit() {
        ResourceLocation rl = new ResourceLocation("tutorial_mod", "test_block");
        testBlock.setRegistryName(rl);
        testItemBlock.setRegistryName(rl);
        GameRegistry.registerTileEntity(TutorialTile.class, rl);
    }

    @SubscribeEvent
    public static void registerBlocks(RegistryEvent.Register<Block> event) {
        IForgeRegistry<Block> registry = event.getRegistry();
        registry.register(testBlock);
    }

    @SubscribeEvent
    public static void registerItems(RegistryEvent.Register<Item> event) {
        IForgeRegistry<Item> registry = event.getRegistry();
        registry.register(testItemBlock);
    }

    public TutorialBlock() {
        super(Material.ROCK);
    }

    @Nullable
    @Override
    public TileEntity createNewTileEntity(@NotNull World worldIn, int meta) {
        return new TutorialTile();
    }

    @Override
    public boolean onBlockActivated(World worldIn, @NotNull BlockPos pos, @NotNull IBlockState state, @NotNull EntityPlayer playerIn, @NotNull EnumHand hand, @NotNull EnumFacing facing, float hitX, float hitY, float hitZ) {
        if (!worldIn.isRemote) {
            GuiFactories.tileEntity().open(playerIn, pos);
        }
        return true;
    }
}
```

## Creating the TileEntity

This is fairly simple. Extend `TileEntity` and implement `IGuiHolder<PosGuiData>`. Then override `buildUI()`. You can also override
`createScreen()` to create a custom screen, but most of the time you won't need that.

:::info {id="info"}
The generic type of `IGuiHolder` must be of type `GuiData`. See [here](./getting-started.md#synced-gui) for details.
:::

Inside the `buildUI()` is where the fun stuff happens. The method is called on both client and server side, but only on
client side the widgets are kept. But on both sides the syncing information is kept.
Here we currently only create a panel and attach the player inventory. **The GUI must be synced for ANY slots to work!**

```java
public class TutorialTile extends TileEntity implements IGuiHolder<PosGuiData> {

    @Override
    public ModularPanel buildUI(PosGuiData guiData, PanelSyncManager syncManager, UISettings settings) {
        ModularPanel panel = ModularPanel.defaultPanel("tutorial_gui");
        panel.bindPlayerInventory();
        return panel;
    }
}
```

Our GUI now looks like this. We have a correctly positioned player inventory at the bottom.
![grafik](https://github.com/CleanroomMC/ModularUI/assets/45517902/affc34c2-e89a-4f5a-9010-8ac352145cc9)

## Syncing custom values

Now let's add a progress bar to the GUI. For that we first make the tile ticking by implementing `ITickable` into the
`TutorialTile`. Inside `update()` we update the progress variable, but only on server side to simulate a working machine
(and to showcase syncing). Once the progress reaches 100 ticks it's reset to 0. 100 ticks equals 5 seconds.

```java
private int progress = 0;

@Override
public void update() {
    if (!getWorld().isRemote && this.progress++ == 100) {
        this.progress = 0;
    }
}
```

Now add a progress widget to the panel.

```java
@Override
public ModularPanel buildUI(PosGuiData guiData, PanelSyncManager syncManager, UISettings settings) {
    ModularPanel panel = ModularPanel.defaultPanel("tutorial_gui");
    panel.bindPlayerInventory()
            .child(new ProgressWidget()
                    .size(20)
                    .leftRel(0.5f).topRelAnchor(0.25f, 0.5f)
                    .texture(GuiTextures.PROGRESS_ARROW, 20)
                    .value(new DoubleSyncValue(() -> this.progress / 100.0, val -> this.progress = (int) (val * 100))));
    return panel;
}
```

The whole syncing information is in this line:

```java
.value(new DoubleSyncValue(() -> this.progress / 100.0, val -> this.progress = (int) (val * 100))));
```

`value()` accepts an instance of `IDoubleValue`. If we want the value to be synced we need to use `DoubleSyncValue`. The
constructor needs to arguments. A getter as `DoubleSupplier` and a setter as `DoubleConsumer`. The progress widget wants
a double value between 0 and 1 so we need to divide by the maximum value (100). The getter is called on server side and
compared by a cached value to figure out if it needs to be synced. On client side the setter is called to update our
progress field on client side. But since only the widget needs that value and nothing else we could also pass in `null`
for the second argument (the DoubleSyncValue caches it's own progress value based on the passed getter).
Most sync handlers work the same way, but can implement almost any custom behaviour.

You can disable JEI in your synced GUI by adding this line into your `buildUI()` method. If JEI is currently not 
installed, nothing will happen. The game won't crash.

```java
settings.getJeiSettings().disableJei();
```

## Result

The progress bar takes 5 seconds to fill up and then restarts as expected.
![grafik](https://github.com/CleanroomMC/ModularUI/assets/45517902/62dfbe81-0093-471a-a7f2-36c7d1808a4e)
The full tile entity:

```java
public class TutorialTile extends TileEntity implements IGuiHolder<PosGuiData>, ITickable {

    private int progress = 0;

    @Override
    public ModularPanel buildUI(PosGuiData guiData, PanelSyncManager syncManager, UISettings settings) {
        // disables jei
        settings.getJeiSettings().disableJei();

        ModularPanel panel = ModularPanel.defaultPanel("tutorial_gui");
        panel.bindPlayerInventory()
                .child(new ProgressWidget()
                        .size(20)
                        .leftRel(0.5f).topRelAnchor(0.25f, 0.5f)
                        .texture(GuiTextures.PROGRESS_ARROW, 20)
                        .value(new DoubleSyncValue(() -> this.progress / 100.0, val -> this.progress = (int) (val * 100))));
        return panel;
    }

    @Override
    public void update() {
        if (!getWorld().isRemote && this.progress++ == 100) {
            this.progress = 0;
        }
    }
}
```
