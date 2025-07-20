class MedicalParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
        this.size = Math.random() * 20 + 10;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.speed = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * 0.02 - 0.01;
        this.rotationSpeed = Math.random() * 0.01 - 0.005;
        
        // Medical icons
        this.icons = ['❤️', '🩺', '💊', '💉', '🩹', '🧬', '🧫', '🧪', '🔬', '📋'];
        this.icon = this.icons[Math.floor(Math.random() * this.icons.length)];
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = Math.random() * 0.5 - 0.25;
        this.vy = Math.random() * 0.5 - 0.25;
        this.size = Math.random() * 20 + 10;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.pulseSpeed = Math.random() * 0.005 + 0.002;
        this.pulseSize = 0;
        this.pulseDirection = 1;
    }

    update() {
        // Update position
        this.x += Math.sin(this.angle) * this.speed;
        this.y += Math.cos(this.angle) * this.speed;
        this.angle += this.rotation;
        
        // Pulse effect
        this.pulseSize += this.pulseSpeed * this.pulseDirection;
        if (this.pulseSize > 0.5) this.pulseDirection = -1;
        if (this.pulseSize < -0.5) this.pulseDirection = 1;
        
        // Check boundaries
        if (this.x < -50) this.x = this.canvas.width + 50;
        if (this.x > this.canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = this.canvas.height + 50;
        if (this.y > this.canvas.height + 50) this.y = -50;
        
        // Random direction change
        if (Math.random() < 0.01) {
            this.angle += (Math.random() - 0.5) * 0.5;
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.font = `${this.size * (1 + this.pulseSize * 0.1)}px Arial`;
        this.ctx.globalAlpha = this.opacity * (0.8 + this.pulseSize * 0.4);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.angle);
        this.ctx.fillText(this.icon, 0, 0);
        this.ctx.restore();
    }
}

class MedicalBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 20;
        
        // Set canvas styles
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.1';
        this.canvas.style.pointerEvents = 'none';
        
        // Add to body
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        // Initialize
        this.init();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    init() {
        this.resizeCanvas();
        this.createParticles();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new MedicalParticle(this.canvas));
        }
    }
    
    handleResize() {
        this.resizeCanvas();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connecting lines between nearby particles
        this.drawConnections();
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    drawConnections() {
        const maxDistance = 200;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = 1 - (distance / maxDistance) * 0.8;
                    this.ctx.strokeStyle = `rgba(79, 195, 247, ${opacity * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

// Initialize the background when the page loads
window.addEventListener('load', () => {
    new MedicalBackground();
});
