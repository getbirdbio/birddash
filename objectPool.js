export default class ObjectPool {
    constructor(scene, createFn, resetFn, maxSize = 50) {
        this.scene = scene;
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        
        this.available = [];
        this.active = [];
        
        // Pre-populate pool
        this.warmUp(10);
    }
    
    warmUp(count) {
        for (let i = 0; i < count; i++) {
            const obj = this.createFn();
            obj.setActive(false).setVisible(false);
            this.available.push(obj);
        }
    }
    
    get() {
        let obj;
        
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFn();
        }
        
        obj.setActive(true).setVisible(true);
        this.active.push(obj);
        
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
        
        obj.setActive(false).setVisible(false);
        
        // Clear any tweens
        if (this.scene.tweens) {
            this.scene.tweens.killTweensOf(obj);
        }
        
        // Reset physics body if exists
        if (obj.body) {
            obj.body.reset(0, 0);
        }
        
        // Only keep up to maxSize objects
        if (this.available.length < this.maxSize) {
            this.available.push(obj);
        } else {
            obj.destroy();
        }
    }
    
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
    
    destroy() {
        this.releaseAll();
        this.available.forEach(obj => obj.destroy());
        this.available = [];
    }
    
    getActiveCount() {
        return this.active.length;
    }
    
    getAvailableCount() {
        return this.available.length;
    }
}
