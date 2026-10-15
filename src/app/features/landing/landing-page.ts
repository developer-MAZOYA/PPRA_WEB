import {
  Component, Directive, ElementRef, Input, NgZone, inject, signal,
  OnInit, OnDestroy, AfterViewInit, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { LoginModal } from '../auth/login/login/login-modal';
import { RegisterModal } from '../auth/register/register/register-modal';        
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService, AppLanguage } from '../../core/i18n/language.service';

interface HeroSlide {
  title: string;
  titleAccent: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  image: string;
  align: 'left' | 'center' | 'right';
}

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface FooterLink {
  label: string;
  href: string;
}

/** Splits "1,890+" into { num: 1890, suffix: '+' } for the count-up animation. */
function parseStat(v: string): { num: number; suffix: string } {
  const m = v.match(/^([\d,]+)(.*)$/);
  return { num: m ? parseInt(m[1].replace(/,/g, ''), 10) : 0, suffix: m ? m[2] : '' };
}

/**
 * Scroll-reveal directive.
 * Usage: <div reveal [revealDelay]="120"> … </div>   or   <div reveal="line">
 * Adds the `revealed` class the first time the element enters the viewport.
 */
@Directive({ selector: '[reveal]', standalone: true })
export class Reveal implements AfterViewInit, OnDestroy {
  @Input('reveal') variant = '';
  @Input() revealDelay = 0;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private io?: IntersectionObserver;

  ngAfterViewInit() {
    const node = this.el.nativeElement;
    node.style.setProperty('--rd', `${this.revealDelay}ms`);

    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      node.classList.add('revealed');
      return;
    }
    this.io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('revealed');
          this.io?.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    this.io.observe(node);
  }

  ngOnDestroy() { this.io?.disconnect(); }
}

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, MatIconModule, LoginModal, RegisterModal, Reveal],
  template: `
    <div class="landing" [class.dark]="darkMode()"
         [class.a11y-contrast-dark]="contrast() === 'dark' || contrast() === 'inverted'"
         [class.a11y-contrast-light]="contrast() === 'light'"
         [class.a11y-text-small]="textSize() === 's'"
         [class.a11y-text-large]="textSize() === 'l'"
         [class.a11y-text-xlarge]="textSize() === 'xl'"
         [class.a11y-text-xxlarge]="textSize() === 'xxl'">

      <!-- ═══════════ UTILITY TOP BAR ═══════════ -->
      <div class="utility-bar">
        <div class="utility-inner">
          <div class="utility-left">
            <a class="utility-item" href="tel:+255262963854">
              <mat-icon>call</mat-icon>
              <span>0800008272</span>
            </a>
            <a class="utility-item" href="mailto:dg@ppra.go.tz">
              <mat-icon>mail_outline</mat-icon>
              <span>dawitilahuduma&#64;ppra.go.tz</span>
            </a>
            <a class="utility-item" href="#contact">Contact Us</a>
            <a class="utility-item" href="#faq">FAQs</a>
            <a class="utility-item" href="#feedback">Feedback</a>
          </div>

          <div class="utility-right">
            <button type="button" class="util-icon" (click)="toggleDarkMode()" aria-label="Toggle dark mode">
              <mat-icon>{{ darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <div class="lang-switch">
              <button type="button" class="lang-btn" [class.active]="lang() === 'en'" (click)="setLanguage('en')">
                <span class="flag">🇬🇧</span>
                <strong>EN</strong>
              </button>
              <button type="button" class="lang-btn" [class.active]="lang() === 'sw'" (click)="setLanguage('sw')">
                <span class="flag">🇹🇿</span>
                <strong>SW</strong>
              </button>
            </div>

            <button type="button" class="util-icon" (click)="openAccessibility()" aria-label="Accessibility">
              <mat-icon>accessibility_new</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- ═══════════ HEADER ═══════════ -->
      <header class="main-header" [class.scrolled]="scrolled()">
        <div class="header-inner">

          <div class="header-left">
            <img src="emblem.png" alt="Tanzania Emblem" class="header-emblem" />
          </div>

          <div class="header-center">
            <span class="header-country">THE UNITED REPUBLIC OF TANZANIA</span>
            <h1 class="header-title">PUBLIC PROCUREMENT REGULATORY AUTHORITY</h1>
            <span class="header-sub">PPRA Asset Management System · ISO 9001:2015 Certified</span>
          </div>

          <div class="header-right">
            <img src="logo-ppra.png" alt="PPRA" class="header-logo" />
          </div>

        </div>
      </header>

      <!-- ═══════════ PRIMARY NAV ═══════════ -->
      <nav class="primary-nav" [class.stuck]="navStuck()">
        <div class="nav-inner">
          <a class="nav-mini-logo" [class.show]="navStuck()" href="#home" aria-label="Home">
            <img src="emblem.png" alt="" />
          </a>
          <ul class="nav-links">
            @for (item of navItems; track item.label) {
              <li class="nav-item" [class.has-drop]="item.children">
                <a [href]="item.href" class="nav-link">
                  {{ item.label }}
                  @if (item.children) { <mat-icon class="caret">expand_more</mat-icon> }
                </a>
                @if (item.children) {
                  <div class="dropdown">
                    <ul>
                      @for (child of item.children; track child.label) {
                        <li><a [href]="child.href">{{ child.label }}</a></li>
                      }
                    </ul>
                  </div>
                }
              </li>
            }
          </ul>

          <div class="nav-right">
            <button type="button" class="nav-search" aria-label="Search"><mat-icon>search</mat-icon></button>
            <button type="button" class="nav-login" (click)="openLogin()">
              <mat-icon>login</mat-icon><span>Sign In</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- ═══════════ NEWS TICKER ═══════════ -->
      @if (!closeTicker()) {
        <div class="ticker-wrap">
          <div class="ticker">
            <span class="ticker-badge"><span class="dot"></span>NEWS</span>
            <span class="ticker-date">{{ today }}</span>
            <span class="ticker-text">PPRA INAWEZESHA MAENDELEO YA UCHUMI WA KIDIJITI KWA UWAZI NA UFANISI</span>
            <div class="ticker-nav">
              <button type="button" (click)="prevSlide()" aria-label="Previous"><mat-icon>chevron_left</mat-icon></button>
              <button type="button" (click)="nextSlide()" aria-label="Next"><mat-icon>chevron_right</mat-icon></button>
              <button type="button" (click)="closeTicker.set(true)" aria-label="Close"><mat-icon>close</mat-icon></button>
            </div>
          </div>
        </div>
      }

      <!-- ═══════════ HERO ═══════════ -->
      <section class="hero-carousel" id="home">
        <button type="button" class="hero-nav hero-nav-left" (click)="prevSlide()" aria-label="Previous">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <div class="hero-slide">
          @for (s of slides; track s.title; let i = $index) {
            <div class="hero-bg" [class.active]="i === currentIndex()"
                 [style.background-image]="'url(' + s.image + ')'"></div>
          }
          <div class="hero-overlay"></div>
          <div class="hero-content">
            @for (s of [currentSlide()]; track s.title) {
              <div class="hero-text">
                <h2 class="hero-title" [attr.aria-label]="s.title + ' ' + s.titleAccent">
                  <span class="type-ghost" aria-hidden="true">{{ s.title }}<span class="accent">{{ s.titleAccent }}</span></span>
                  <span class="type-live" aria-hidden="true">{{ typedTitle() }}@if (typingPhase() === 'title') {<span class="cursor"></span>}<span class="accent">{{ typedAccent() }}@if (typingPhase() !== 'title') {<span class="cursor"></span>}</span></span>
                </h2>
                <div class="hero-accent-line"></div>
                <p class="hero-sub">{{ s.subtitle }}</p>
                <a class="hero-cta" [href]="s.ctaLink">
                  <span>{{ s.cta }}</span>
                  <mat-icon>chevron_right</mat-icon>
                </a>
              </div>
            }
          </div>
        </div>
        <button type="button" class="hero-nav hero-nav-right" (click)="nextSlide()" aria-label="Next">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <div class="hero-dots">
          @for (s of slides; track $index; let i = $index) {
            <button type="button" class="dot" [class.active]="i === currentIndex()"
                    (click)="goToSlide(i)" [attr.aria-label]="'Slide ' + (i+1)"></button>
          }
        </div>
      </section>

      <!-- ═══════════ FEATURED ═══════════ -->
      <section class="featured" id="features">
        <div class="section-inner">
          <span class="section-badge" reveal>WHAT WE DO</span>
          <h2 class="section-title" reveal [revealDelay]="80">Featured <span class="accent">Services</span></h2>
          <div class="section-underline" reveal="line" [revealDelay]="160"></div>
          <div class="featured-scroller" reveal [revealDelay]="200">
            <div class="featured-track">
              @for (f of marqueeItems; track $index; let i = $index) {
                <div class="featured-card" [attr.aria-hidden]="i >= features.length ? 'true' : null"
                     [style.background-image]="'url(' + f.image + ')'">
                  <div class="featured-overlay"></div>
                  <div class="featured-body">
                    <h3>{{ f.title }}</h3>
                    <span class="featured-line"></span>
                    <span class="read-more">Read more <mat-icon>arrow_forward</mat-icon></span>
                  </div>
                  <button type="button" class="circle-arrow" aria-label="Open"><mat-icon>arrow_outward</mat-icon></button>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════ VERIFY ═══════════ -->
      <section class="verify" id="stats">
        <div class="section-inner">
          <div class="tab-row" reveal>
            @for (t of tabs; track t; let i = $index) {
              <button type="button" class="tab-pill" [class.active]="activeTab() === i" (click)="activeTab.set(i)">{{ t }}</button>
            }
          </div>
          @for (tabKey of [activeTab()]; track tabKey) {
            <div class="verify-grid">
              @for (v of verifyCards; track v.title; let i = $index) {
                <div class="verify-card" reveal [revealDelay]="i * 80" [style.background-image]="'url(' + v.image + ')'">
                  <div class="verify-overlay"></div>
                  <div class="verify-body">
                    <h3>{{ v.title }}</h3>
                    <div class="verify-text">
                      <span class="accent-bar"></span>
                      <p>{{ v.desc }}</p>
                    </div>
                  </div>
                  <button type="button" class="circle-arrow light" aria-label="Open"><mat-icon>arrow_outward</mat-icon></button>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- ═══════════ PUBLIC NOTICES ═══════════ -->
      <section class="notices">
        <div class="section-inner">
          <span class="section-badge" reveal>PUBLICATIONS</span>
          <h2 class="section-title" reveal [revealDelay]="80">Public Procurement <span class="accent">Guidelines</span></h2>
          <div class="section-underline" reveal="line" [revealDelay]="160"></div>

          <div class="notices-list">
            @for (n of visibleNotices(); track n.title; let i = $index) {
              <a class="notice-item" href="#" reveal [revealDelay]="(i % 4) * 80">
                <span class="notice-date">{{ n.date }}</span>
                <span class="notice-title">{{ n.title }}</span>
                <mat-icon class="notice-arrow">arrow_forward</mat-icon>
              </a>
            }
          </div>

          <div class="notices-actions">
            <button type="button" class="outline-btn" (click)="toggleNotices()">
              {{ noticesExpanded() ? 'Show Less' : 'View All Publications' }}
              <mat-icon>{{ noticesExpanded() ? 'expand_less' : 'chevron_right' }}</mat-icon>
            </button>
          </div>
        </div>
      </section>

      <!-- ═══════════ IMPACT ═══════════ -->
      <section class="impact">
        <div class="impact-card" #impactCard reveal>
          <span class="section-badge">OUR STATISTICS</span>
          <h2 class="section-title">Impact by the <span class="accent">Numbers</span></h2>
          <div class="section-underline"></div>
          <p class="section-subtitle">We pride ourselves on transparency and growth. Here is a snapshot of our current asset register.</p>
          <div class="impact-grid">
            @for (s of stats; track s.label; let i = $index) {
              <div class="impact-item" reveal [revealDelay]="150 + i * 110">
                <div class="impact-icon" [style.background]="s.bg" [style.color]="s.color">
                  <mat-icon>{{ s.icon }}</mat-icon>
                </div>
                <div class="impact-stat">{{ statDisplay()[i].value }}<span class="stat-suffix" [class.plus]="statDisplay()[i].suffix === '+'">{{ statDisplay()[i].suffix }}</span></div>
                <div class="impact-label">{{ s.label }}</div>
              </div>
            }
          </div>
          <div class="impact-actions">
            <a class="impact-link" href="#">View Detailed Report <mat-icon>arrow_forward</mat-icon></a>
          </div>
        </div>
      </section>

      <!-- ═══════════ GALLERY ═══════════ -->
      <section class="gallery">
        <div class="section-inner">
          <span class="section-badge" reveal>MEDIA HUB</span>
          <h2 class="section-title" reveal [revealDelay]="80">Gallery</h2>
          <div class="section-underline" reveal="line" [revealDelay]="160"></div>
          <div class="gallery-grid">
            @for (g of gallery; track g.title; let i = $index) {
              <div class="gallery-card" reveal [revealDelay]="i * 110" [style.background-image]="'url(' + g.image + ')'">
                <div class="gallery-overlay"></div>
                <span class="gallery-date">{{ g.date }}</span>
                <button type="button" class="play-btn" aria-label="Play"><mat-icon>play_arrow</mat-icon></button>
                <div class="gallery-caption">{{ g.title }}</div>
              </div>
            }
          </div>
          <div class="gallery-actions" reveal>
            <a class="outline-btn" href="#">View full gallery <mat-icon>chevron_right</mat-icon></a>
          </div>
        </div>
      </section>

      <!-- ═══════════ CTA ═══════════ -->
      <section class="cta" id="contact">
        <canvas #burstCanvas class="burst-canvas" aria-hidden="true"></canvas>
        <h2 reveal>Ready to get started?</h2>
        <p reveal [revealDelay]="100">Sign in to access your asset dashboard.</p>
        <button type="button" class="hero-cta solid" reveal [revealDelay]="200" (click)="openLogin()">
          <span>Sign In Now</span><mat-icon>arrow_forward</mat-icon>
        </button>
      </section>

      <!-- ═══════════ FOOTER ═══════════ -->
      <footer class="site-footer">
        <div class="footer-inner">

          <div class="footer-col contact-col" reveal>
            <h4>Contact Us</h4>
            <p class="footer-address">
              Public Procurement Regulatory Authority (PPRA),<br>
              Tambukareli Dodoma,<br>
              3 Ununuzi Street,<br>
              P. O. Box 2865,<br>
              41104 Dodoma, TANZANIA
            </p>
            <ul class="footer-list">
              <li><mat-icon>mail_outline</mat-icon><a href="mailto:dg@ppra.go.tz">dg&#64;ppra.go.tz</a></li>
              <li><mat-icon>call</mat-icon><a href="tel:+255262963854">+255 (0) 26 296 3854</a></li>
            </ul>
          </div>

          <div class="footer-col" reveal [revealDelay]="100">
            <h4>Zonal Offices</h4>
            <ul class="footer-list compact">
              @for (z of visibleZones(); track z.name) {
                <li>
                  <mat-icon>location_on</mat-icon>
                  <a href="mailto:{{ z.email }}">{{ z.name }} — {{ z.city }}</a>
                </li>
              }
            </ul>
            <button type="button" class="view-more" (click)="toggleZones()">
              {{ zonesExpanded() ? 'Show Less' : 'View More' }}
              <mat-icon>{{ zonesExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </div>

          <div class="footer-col" reveal [revealDelay]="200">
            <h4>Related Links</h4>
            <ul class="footer-list compact">
              @for (l of visibleRelated(); track l.label) {
                <li><mat-icon>chevron_right</mat-icon><a [href]="l.href">{{ l.label }}</a></li>
              }
            </ul>
            <button type="button" class="view-more" (click)="toggleRelated()">
              {{ relatedExpanded() ? 'Show Less' : 'View More' }}
              <mat-icon>{{ relatedExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </div>

          <div class="footer-col" reveal [revealDelay]="300">
            <h4>Quick Links</h4>
            <ul class="footer-list compact">
              @for (l of visibleQuick(); track l.label) {
                <li><mat-icon>chevron_right</mat-icon><a [href]="l.href">{{ l.label }}</a></li>
              }
            </ul>
            <button type="button" class="view-more" (click)="toggleQuick()">
              {{ quickExpanded() ? 'Show Less' : 'View More' }}
              <mat-icon>{{ quickExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
          </div>

        </div>

        <div class="footer-bottom">
          <div class="footer-bottom-inner">
            <div class="footer-copy">
              © 2026 PPRA, All Rights Reserved. · Content maintained by Public Procurement Regulatory Authority
            </div>
            <div class="footer-social">
              <a href="#" aria-label="Facebook"><mat-icon>facebook</mat-icon></a>
              <a href="#" aria-label="YouTube"><mat-icon>smart_display</mat-icon></a>
              <a href="#" aria-label="Instagram"><mat-icon>photo_camera</mat-icon></a>
              <a href="#" aria-label="LinkedIn"><mat-icon>work</mat-icon></a>
              <a href="#" aria-label="WhatsApp"><mat-icon>chat</mat-icon></a>
            </div>
          </div>
        </div>
      </footer>

      <!-- ═══════════ FLOATING SETTINGS PILL ═══════════ -->
      <div class="floating-settings">
        <button type="button" (click)="toggleDarkMode()" [class.active]="darkMode()">
          <mat-icon>{{ darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>
        <span class="divider"></span>
        <button type="button" [class.active]="lang() === 'en'" (click)="setLanguage('en')"><span class="flag">🇬🇧</span> EN</button>
        <button type="button" [class.active]="lang() === 'sw'" (click)="setLanguage('sw')"><span class="flag">🇹🇿</span> SW</button>
        <span class="divider"></span>
        <button type="button" (click)="openAccessibility()" aria-label="Accessibility">
          <mat-icon>accessibility_new</mat-icon>
        </button>
      </div>

      <!-- ═══════════ SCROLL TOP ═══════════ -->
      @if (scrolled()) {
        <button type="button" class="scroll-top" (click)="scrollToTop()" aria-label="Scroll to top">
          <mat-icon>keyboard_arrow_up</mat-icon>
        </button>
      }

      <!-- ═══════════ ACCESSIBILITY PANEL ═══════════ -->
      <div class="a11y-backdrop" [class.open]="a11yOpen()" (click)="closeAccessibility()"></div>

      <aside #a11yPanel class="a11y-panel" [class.open]="a11yOpen()" role="dialog" aria-modal="true" aria-labelledby="a11y-title" [attr.inert]="a11yOpen() ? null : ''" [attr.aria-hidden]="!a11yOpen()">
        <div class="a11y-head">
          <div class="a11y-head-left">
            <div class="a11y-logo"><mat-icon>accessibility_new</mat-icon></div>
            <div>
              <h3 id="a11y-title">Accessibility Menu <span class="shortcut">(CTRL+U)</span></h3>
              <p>Customize your experience</p>
            </div>
          </div>
          <button #a11yClose type="button" class="a11y-close" (click)="closeAccessibility()" aria-label="Close accessibility menu">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="a11y-body">
          <div class="a11y-section">
            <div class="a11y-label">LANGUAGE</div>
            <div class="a11y-grid-2">
              <button type="button" class="a11y-option" [class.active]="lang() === 'en'" [attr.aria-pressed]="lang() === 'en'" (click)="setLanguage('en')">
                <span class="flag-big">🇬🇧</span>
                <span class="opt-text"><strong>EN</strong><small>English</small></span>
                @if (lang() === 'en') { <mat-icon class="check">check</mat-icon> }
              </button>
              <button type="button" class="a11y-option" [class.active]="lang() === 'sw'" [attr.aria-pressed]="lang() === 'sw'" (click)="setLanguage('sw')">
                <span class="flag-big">🇹🇿</span>
                <span class="opt-text"><strong>SW</strong><small>Kiswahili</small></span>
                @if (lang() === 'sw') { <mat-icon class="check">check</mat-icon> }
              </button>
            </div>
          </div>

          <div class="a11y-section">
            <div class="a11y-label">THEME</div>
            <div class="a11y-grid-2">
              <button type="button" class="a11y-option col" [class.active]="!darkMode()" [attr.aria-pressed]="!darkMode()" (click)="setTheme('light')">
                <mat-icon>light_mode</mat-icon><span>Light</span>
                @if (!darkMode()) { <mat-icon class="check">check</mat-icon> }
              </button>
              <button type="button" class="a11y-option col" [class.active]="darkMode()" [attr.aria-pressed]="darkMode()" (click)="setTheme('dark')">
                <mat-icon>dark_mode</mat-icon><span>Dark</span>
                @if (darkMode()) { <mat-icon class="check">check</mat-icon> }
              </button>
            </div>
          </div>

          <div class="a11y-section">
            <div class="a11y-label">CONTRAST</div>
            <div class="a11y-grid-4">
              <button type="button" class="a11y-option col" [class.active]="contrast() === 'normal'" [attr.aria-pressed]="contrast() === 'normal'" (click)="setContrast('normal')">
                <mat-icon>contrast</mat-icon><span>Normal</span>
              </button>
              <button type="button" class="a11y-option col" [class.active]="contrast() === 'inverted'" [attr.aria-pressed]="contrast() === 'inverted'" (click)="setContrast('inverted')">
                <mat-icon>invert_colors</mat-icon><span>Inverted</span>
              </button>
              <button type="button" class="a11y-option col" [class.active]="contrast() === 'dark'" [attr.aria-pressed]="contrast() === 'dark'" (click)="setContrast('dark')">
                <mat-icon>brightness_4</mat-icon><span>Dark</span>
              </button>
              <button type="button" class="a11y-option col" [class.active]="contrast() === 'light'" [attr.aria-pressed]="contrast() === 'light'" (click)="setContrast('light')">
                <mat-icon>brightness_7</mat-icon><span>Light</span>
              </button>
            </div>
          </div>

          <div class="a11y-section">
            <div class="a11y-label">TEXT SIZE</div>
            <div class="a11y-grid-5">
              @for (sz of textSizes; track sz) {
                <button type="button" class="a11y-option col"
                        [class.active]="textSize() === sz"
                        [attr.aria-pressed]="textSize() === sz"
                        (click)="setTextSize(sz)">
                  <span>{{ labelForSize(sz) }}</span>
                </button>
              }
            </div>
          </div>

          <div class="a11y-section">
            <div class="a11y-label">READ ALOUD</div>
            <button type="button" class="a11y-option wide" [class.active]="readAloud()" [attr.aria-pressed]="readAloud()" (click)="toggleReadAloud()">
              <mat-icon>{{ readAloud() ? 'volume_up' : 'volume_off' }}</mat-icon>
              <span class="opt-text">
                <strong>{{ readAloud() ? 'Reading aloud enabled' : 'Enable Read Aloud' }}</strong>
                <small>Hover over or keyboard-focus links and buttons to hear them.</small>
              </span>
            </button>
          </div>
        </div>

        <div class="a11y-footer">
          <button type="button" class="a11y-reset" (click)="resetAccessibility()">
            <mat-icon>restart_alt</mat-icon> Reset All
          </button>
        </div>
      </aside>

      <!-- ═══════════ MODALS ═══════════ -->
      @if (loginOpen()) {
        <app-login-modal
          (close)="closeLogin()"
          (switchToRegister)="switchToRegister()">
        </app-login-modal>
      }

      @if (registerOpen()) {
        <app-register-modal
          (close)="closeRegister()"
          (switchToLogin)="switchToLogin()">
        </app-register-modal>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    .landing {
      min-height: 100vh;
      background: #FFFFFF;
      font-family: 'Roboto', sans-serif;
      color: #1F2937;
      transition: background 0.4s ease, color 0.4s ease;
    }

    /* ═══════════ UTILITY TOP BAR (GOLD — MATCHES PRIMARY NAV) ═══════════ */
    .utility-bar {
      background: linear-gradient(90deg, #78350F 0%, #8B6914 100%);
      color: rgba(255,255,255,0.92);
      font-size: 0.82rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 2px 8px rgba(120, 53, 15, 0.15);
    }
    .utility-inner {
      max-width: 1400px; margin: 0 auto; padding: 10px 24px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
    }
    .utility-left, .utility-right { display: flex; align-items: center; gap: 20px; }

    .utility-item {
      display: inline-flex; align-items: center; gap: 8px;
      color: rgba(255,255,255,0.92);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.82rem;
      letter-spacing: 0.01em;
      transition: color 0.2s;
      &:hover { color: #FDB913; }
      mat-icon {
        font-size: 18px; height: 18px; width: 18px;
        color: rgba(255,255,255,0.88);
        transition: color 0.2s;
      }
      &:hover mat-icon { color: #FDB913; }
    }

    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.7);
      border-radius: 999px;
      font-weight: 800;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      .flag { font-size: 0.9rem; line-height: 1; }
      strong { font-weight: 800; }
      &:hover { color: #FDB913; }
      &.active {
        background: #FDB913;
        color: #78350F;
        box-shadow:
          0 2px 12px rgba(253, 185, 19, 0.4),
          0 0 0 1px rgba(253, 185, 19, 0.3) inset;
        .flag { transform: scale(1.1); }
      }
    }

    .util-icon {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255,255,255,0.92);
      cursor: pointer;
      display: grid; place-items: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(253, 185, 19, 0.2);
        border-color: rgba(253, 185, 19, 0.6);
        color: #FDB913;
        box-shadow: 0 0 20px rgba(253, 185, 19, 0.3);
        transform: translateY(-1px);
      }
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }

    /* ═══════════ MAIN HEADER ═══════════ */
    .main-header {
      background-color: #FFFFFF;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140' viewBox='0 0 260 140'><g fill='none' stroke='%238B6914' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='0.10'><g transform='translate(15,10)'><rect x='0' y='0' width='26' height='18' rx='2'/><line x1='5' y1='0' x2='5' y2='18'/><line x1='10' y1='0' x2='10' y2='18'/><line x1='15' y1='0' x2='15' y2='18'/><line x1='20' y1='0' x2='20' y2='18'/></g><g transform='translate(60,15)'><rect x='0' y='6' width='22' height='16' rx='1.5'/><path d='M4 6 L6 -2 L16 -2 L18 6'/></g><g transform='translate(105,10)'><rect x='0' y='0' width='30' height='20' rx='1.5'/><line x1='0' y1='15' x2='30' y2='15'/><circle cx='26' cy='17.5' r='0.8'/></g><g transform='translate(150,20)'><rect x='0' y='0' width='10' height='16' rx='1.5'/><line x1='3.5' y1='13' x2='6.5' y2='13'/></g><g transform='translate(180,12)'><rect x='0' y='0' width='34' height='14' rx='1'/><line x1='4' y1='7' x2='30' y2='7'/></g><g transform='translate(230,15)'><rect x='0' y='0' width='20' height='16' rx='1.5'/><line x1='0' y1='5' x2='20' y2='5'/><line x1='0' y1='11' x2='20' y2='11'/></g><g transform='translate(20,75)'><rect x='0' y='0' width='28' height='20' rx='1.5'/><rect x='4' y='4' width='20' height='12'/><line x1='14' y1='20' x2='14' y2='26'/><line x1='7' y1='26' x2='21' y2='26'/></g><g transform='translate(70,80)'><circle cx='9' cy='9' r='9'/><path d='M4.5 4.5 L13.5 13.5'/><path d='M13.5 4.5 L4.5 13.5'/></g><g transform='translate(115,75)'><path d='M3 12 L3 6 A9 9 0 0 1 21 6 L21 12'/><rect x='0' y='12' width='5' height='7' rx='1'/><rect x='19' y='12' width='5' height='7' rx='1'/></g><g transform='translate(160,80)'><rect x='0' y='0' width='16' height='22' rx='2'/><rect x='3' y='4' width='10' height='10'/><circle cx='8' cy='18' r='1'/></g><g transform='translate(195,78)'><rect x='0' y='0' width='22' height='14' rx='1'/><path d='M4 3 L4 8 M8 3 L8 8 M12 3 L12 8 M16 3 L16 8'/></g><g transform='translate(235,80)'><path d='M2 4 L2 16 L22 16 L22 4 Z'/><path d='M7 4 L7 8 L17 8 L17 4'/></g></g></svg>");
      background-repeat: repeat;
      background-size: 260px 140px;
      background-position: center;
      border-bottom: 1px solid #FBEDBB;
      transition: box-shadow 0.3s, background 0.4s;
      position: relative;
      z-index: 90;
      &.scrolled { box-shadow: 0 4px 16px rgba(139, 105, 20, 0.08); }
    }
    .header-inner {
      max-width: 1400px; margin: 0 auto; padding: 20px 24px;
      display: grid; grid-template-columns: 130px 1fr 220px;
      align-items: center; gap: 24px; text-align: center;
      position: relative; z-index: 1;
    }
    .header-emblem { height: 96px; width: 96px; object-fit: contain; }
    .header-logo {
      height: 60px; width: 200px; max-width: 100%;
      object-fit: contain; object-position: right center;
    }
    .header-center { display: flex; flex-direction: column; gap: 4px; }
    .header-country {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.15em;
      color: #8B6914; text-transform: uppercase;
    }
    .header-title {
      margin: 0; font-size: clamp(0.95rem, 1.9vw, 1.5rem);
      font-weight: 800; color: #78350F; letter-spacing: 0.01em; line-height: 1.2;
      text-transform: uppercase;
    }
    .header-sub { font-size: 0.72rem; color: #A16207; font-weight: 500; letter-spacing: 0.03em; }

    /* ═══════════ PRIMARY NAV ═══════════ */
    .primary-nav {
      background: linear-gradient(90deg, #78350F 0%, #8B6914 100%);
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 8px rgba(120, 53, 15, 0.15);
      transition: background 0.4s, box-shadow 0.4s;
      &.stuck { box-shadow: 0 6px 22px rgba(120, 53, 15, 0.32); }
    }
    .nav-inner {
      max-width: 1400px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between; gap: 24px;
    }
    .nav-mini-logo {
      display: block; flex-shrink: 0;
      width: 0; height: 38px; margin-right: -24px;
      opacity: 0; overflow: hidden; scale: 0.4;
      transition: width 0.5s cubic-bezier(0.2, 0.7, 0.2, 1),
                  margin 0.5s cubic-bezier(0.2, 0.7, 0.2, 1),
                  opacity 0.4s ease, scale 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
      img { height: 38px; width: 38px; object-fit: contain; display: block; }
      &.show { width: 38px; margin-right: -10px; opacity: 1; scale: 1; }
    }
    .nav-links { display: flex; align-items: center; gap: 0; list-style: none; padding: 0; margin: 0 auto 0 0; }
    .nav-item { position: relative; }
    .nav-link {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 16px 14px; color: rgba(255,255,255,0.88);
      text-decoration: none; font-size: 0.82rem; font-weight: 600;
      letter-spacing: 0.02em; transition: all 0.2s ease; position: relative;
      cursor: pointer;
      .caret { font-size: 14px; height: 14px; width: 14px; transition: transform 0.25s; }
      &:hover { color: #FDB913; background: rgba(255,255,255,0.06); }
    }
    .nav-item:hover {
      .dropdown { opacity: 1; visibility: visible; transform: translateY(0); }
      .caret { transform: rotate(180deg); }
    }
    .dropdown {
      position: absolute;
      top: 100%; left: 0;
      min-width: 260px;
      background: #FFFFFF;
      border: 1px solid #FBEDBB;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 12px 32px rgba(120, 53, 15, 0.15);
      padding: 8px 0;
      opacity: 0; visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
      z-index: 200;
      ul { list-style: none; padding: 0; margin: 0; }
      li a {
        display: block;
        padding: 10px 20px;
        color: #4B5563;
        text-decoration: none;
        font-size: 0.82rem;
        font-weight: 500;
        transition: all 0.15s;
        border-left: 3px solid transparent;
        &:hover {
          background: #FEF9E7;
          color: #78350F;
          border-left-color: #FDB913;
        }
      }
    }
    .nav-right { display: flex; align-items: center; gap: 10px; }
    .nav-search {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.1); color: white;
      cursor: pointer; display: grid; place-items: center; transition: all 0.2s;
      &:hover { background: rgba(255,255,255,0.2); color: #FDB913; }
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }
    .nav-login {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; background: #FDB913; color: #78350F;
      border: none; border-radius: 999px; font-weight: 700; font-size: 0.8rem;
      letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s;
      z-index: 10;
      &:hover {
        background: #FCD34D; transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(253, 185, 19, 0.35);
      }
      mat-icon { font-size: 16px; height: 16px; width: 16px; }
    }

    /* ═══════════ NEWS TICKER ═══════════ */
    .ticker-wrap { max-width: 1400px; margin: 18px auto 0; padding: 0 24px; position: relative; z-index: 5; }
    .ticker {
      padding: 10px 18px;
      background: linear-gradient(90deg, #78350F 0%, #5C2E0E 100%);
      border-radius: 999px; display: flex; align-items: center; gap: 16px;
      box-shadow: 0 8px 24px rgba(120, 53, 15, 0.25);
      transition: background 0.4s, box-shadow 0.4s;
    }
    .ticker-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; background: #FDB913; color: #5C2E0E;
      border-radius: 999px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em;
      .dot { width: 6px; height: 6px; border-radius: 50%; background: #5C2E0E; animation: pulse 2s infinite; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    .ticker-date { color: #FDB913; font-weight: 700; font-size: 0.8rem; white-space: nowrap; }
    .ticker-text {
      flex: 1; color: rgba(255,255,255,0.9); font-weight: 500; font-size: 0.82rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ticker-nav { display: flex; gap: 4px; }
    .ticker-nav button {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08);
      color: white; cursor: pointer; display: grid; place-items: center; transition: all 0.2s;
      &:hover { background: #FDB913; color: #5C2E0E; border-color: #FDB913; }
      mat-icon { font-size: 16px; height: 16px; width: 16px; }
    }

    /* ═══════════ HERO ═══════════ */
    .hero-carousel { position: relative; margin: 24px 0 0; overflow: hidden; }
    .hero-slide {
      position: relative; min-height: 560px; overflow: hidden;
      display: flex; align-items: center;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      opacity: 0; transform: scale(1.09);
      transition: opacity 1.1s ease;
      will-change: opacity, transform;
      &.active {
        opacity: 1;
        animation: kenBurns 7.5s ease-out forwards;
      }
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(90deg,
        rgba(92, 46, 14, 0.92) 0%,
        rgba(120, 53, 15, 0.72) 45%,
        rgba(120, 53, 15, 0.35) 100%);
    }
    .hero-content { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; width: 100%; padding: 80px 40px; }
    .hero-text { max-width: 620px; }

    /* ── HERO TITLE (grid-stacked ghost + live for perfect alignment) ── */
    .hero-title {
      margin: 0 0 18px;
      font-size: clamp(2rem, 4.5vw, 3.25rem);
      font-weight: 800;
      line-height: 1.1;
      color: white;
      letter-spacing: -0.02em;
      display: grid;
      grid-template-columns: 1fr;
    }
    .type-ghost,
    .type-live {
      grid-area: 1 / 1;
      display: block;
      white-space: normal;
    }
    .type-ghost {
      visibility: hidden;
      pointer-events: none;
    }
    .type-live {
      /* visible typed output — no absolute positioning */
    }
    .hero-title .accent {
      color: #FDB913;
      display: inline;
    }
    .hero-accent-line { width: 64px; height: 4px; background: #FDB913; border-radius: 2px; margin-bottom: 22px; }
    .hero-sub { margin: 0 0 32px; font-size: 1rem; color: rgba(255,255,255,0.88); line-height: 1.65; max-width: 540px; }
    .hero-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; background: transparent; color: #FDB913;
      border: 2px solid #FDB913; border-radius: 999px;
      text-decoration: none; font-weight: 700; font-size: 0.85rem;
      letter-spacing: 0.06em; text-transform: uppercase;
      cursor: pointer; transition: all 0.25s ease;
      &:hover {
        background: #FDB913; color: #5C2E0E;
        mat-icon { transform: translateX(4px); }
      }
      &.solid {
        background: #FDB913; color: #5C2E0E;
        &:hover { background: #FCD34D; }
      }
      mat-icon { font-size: 18px; height: 18px; width: 18px; transition: transform 0.25s; }
    }
    .hero-nav {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 3;
      width: 46px; height: 46px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px); color: white;
      cursor: pointer; display: grid; place-items: center; transition: all 0.2s ease, scale 0.25s ease;
      &:hover { background: #FDB913; color: #5C2E0E; border-color: #FDB913; scale: 1.1; }
      mat-icon { font-size: 24px; height: 24px; width: 24px; }
      &.hero-nav-left { left: 24px; }
      &.hero-nav-right { right: 24px; }
    }
    .hero-dots {
      position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
      z-index: 3; display: flex; gap: 8px;
      .dot {
        width: 10px; height: 10px; border-radius: 999px; border: none;
        background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.3s;
        &.active { background: #FDB913; width: 32px; }
      }
    }

    /* ═══════════ SHARED ═══════════ */
    .section-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; text-align: center; }
    .section-badge {
      display: inline-block; padding: 6px 16px;
      background: #FEF9E7; border: 1px solid #FBEDBB;
      color: #78350F; border-radius: 999px;
      font-size: 0.68rem; font-weight: 800;
      letter-spacing: 0.15em; text-transform: uppercase;
      margin-bottom: 14px;
      transition: all 0.4s;
    }
    .section-title {
      margin: 0 0 12px; font-size: clamp(1.6rem, 3.2vw, 2.4rem);
      font-weight: 800; color: #1F2937; letter-spacing: -0.02em;
      .accent { color: #B8860B; }
    }
    .section-underline {
      width: 72px; height: 4px;
      background: linear-gradient(90deg, #FDB913 0%, #16A34A 100%);
      border-radius: 2px; margin: 0 auto 40px;
    }
    .section-subtitle {
      margin: 0 auto 40px; font-size: 0.95rem;
      color: #6B7280; max-width: 640px; line-height: 1.65;
    }

    /* ═══════════ FEATURED (auto-scrolling carousel) ═══════════ */
    .featured { padding: 80px 0 60px; background: #FFFFFF; }
    .featured-scroller {
      position: relative; overflow: hidden;
      margin-top: 8px; padding: 40px 0 48px;
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
      mask-image: linear-gradient(90deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
    }
    .featured-track {
      display: flex; gap: 20px; width: max-content; padding-right: 20px;
      animation: marquee 48s linear infinite;
      will-change: transform;
      &:hover { animation-play-state: paused; }
    }
    .featured-card {
      position: relative; flex: 0 0 280px; height: 260px; border-radius: 16px; overflow: hidden;
      background-size: cover; background-position: center; cursor: pointer;
      transition: transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1), scale 0.45s cubic-bezier(0.2, 0.7, 0.2, 1),
                  box-shadow 0.45s, filter 0.45s, opacity 0.45s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid transparent;
      &:hover {
        transform: translateY(-12px);
        scale: 1.08;
        z-index: 3;
        box-shadow: 0 22px 48px rgba(120, 53, 15, 0.32);
        .circle-arrow { background: #FDB913; color: #5C2E0E; }
        .featured-body h3 { color: #FDB913; }
        .featured-line { width: 40px; }
        .read-more { max-height: 36px; opacity: 1; margin-top: 12px; padding: 7px 14px; }
      }
    }
    /* Dim every other card while one is focused (TCRA-style focus effect) */
    .featured-track:has(.featured-card:hover) .featured-card:not(:hover) {
      filter: grayscale(0.55) brightness(0.82);
      opacity: 0.78;
      scale: 0.94;
    }
    .featured-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(92,46,14,0) 40%, rgba(92,46,14,0.88) 100%);
    }
    .featured-body {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 20px 22px; text-align: left; z-index: 2;
      h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: white; line-height: 1.3; transition: color 0.3s; }
    }
    .featured-line {
      display: block; width: 0; height: 3px; margin-top: 8px;
      background: #FDB913; border-radius: 2px;
      transition: width 0.45s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .read-more {
      display: inline-flex; align-items: center; gap: 6px;
      max-height: 0; opacity: 0; margin-top: 0; padding: 0 14px; overflow: hidden;
      background: #FDB913; color: #5C2E0E; border-radius: 999px;
      font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
      transition: max-height 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.35s ease,
                  margin 0.4s cubic-bezier(0.2, 0.7, 0.2, 1), padding 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
      mat-icon { font-size: 14px; height: 14px; width: 14px; transition: transform 0.25s; }
    }
    .featured-card:hover .read-more mat-icon { animation: nudge 1s ease-in-out infinite; }
    .circle-arrow {
      position: absolute; right: 16px; bottom: 16px; z-index: 3;
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.9); color: #78350F;
      cursor: pointer; display: grid; place-items: center; transition: all 0.25s;
      mat-icon { font-size: 20px; height: 20px; width: 20px; transition: transform 0.25s; }
      &:hover mat-icon { transform: translate(2px, -2px); }
    }

    /* ═══════════ VERIFY ═══════════ */
    .verify { padding: 40px 0 80px; background: #FFFFFF; }
    .tab-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
    .tab-pill {
      padding: 12px 22px; background: #FFFFFF;
      border: 1px solid #E5E7EB; color: #4B5563;
      border-radius: 10px; font-weight: 700; font-size: 0.72rem;
      letter-spacing: 0.08em; text-transform: uppercase;
      cursor: pointer; transition: all 0.25s;
      &:hover { border-color: #FDB913; color: #78350F; }
      &.active {
        background: linear-gradient(135deg, #78350F 0%, #B8860B 100%);
        border-color: #78350F; color: white;
        box-shadow: 0 6px 18px rgba(120, 53, 15, 0.25);
      }
    }
    .verify-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .verify-card {
      position: relative; height: 220px; border-radius: 16px; overflow: hidden;
      background-size: cover; background-position: center; cursor: pointer;
      transition: transform 0.35s, box-shadow 0.35s;
      border: 1px solid transparent;
      &:hover {
        transform: translateY(-6px);
        .circle-arrow { background: #FDB913; color: #5C2E0E; }
        .accent-bar { height: 100%; transform: scaleY(1); }
      }
    }
    .verify-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(15,23,42,0.25) 0%, rgba(15,23,42,0.9) 100%);
    }
    .verify-body {
      position: absolute; left: 0; right: 0; bottom: 0;
      padding: 22px 24px 24px; text-align: left; z-index: 2;
      h3 { margin: 0 0 12px; font-size: 1.05rem; font-weight: 700; color: white; line-height: 1.3; transition: color 0.3s; }
    }
    .verify-card:hover .verify-body h3 { color: #FDB913; }
    .verify-text {
      display: flex; gap: 12px; align-items: stretch;
      .accent-bar { width: 3px; background: #FDB913; border-radius: 2px; flex-shrink: 0; transform-origin: bottom; transition: transform 0.4s; }
      p { margin: 0; font-size: 0.82rem; color: rgba(255,255,255,0.85); line-height: 1.5; }
    }

    /* ═══════════ PUBLIC NOTICES ═══════════ */
    .notices {
      padding: 80px 0;
      background: linear-gradient(180deg, #FFFDF5 0%, #FEF9E7 100%);
      transition: background 0.4s;
    }
    .notices-list {
      max-width: 900px;
      margin: 0 auto 40px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }
    .notice-item {
      display: grid;
      grid-template-columns: 140px 1fr 30px;
      align-items: center;
      gap: 20px;
      padding: 14px 20px;
      background: #FFFFFF;
      border: 1px solid #FBEDBB;
      border-radius: 10px;
      text-decoration: none;
      color: #1F2937;
      transition: all 0.25s ease;
      &:hover {
        border-color: #FDB913;
        background: #FFFFFF;
        box-shadow: 0 6px 20px rgba(253, 185, 19, 0.15);
        transform: translateX(4px);
        .notice-arrow { color: #FDB913; transform: translateX(4px); }
      }
    }
    .notice-date {
      font-size: 0.75rem;
      font-weight: 800;
      color: #8B6914;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .notice-title {
      font-size: 0.88rem;
      font-weight: 500;
      color: #374151;
      line-height: 1.4;
    }
    .notice-arrow {
      color: #B8860B;
      transition: all 0.25s;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    .notices-actions { display: flex; justify-content: center; }

    /* ═══════════ IMPACT ═══════════ */
    .impact {
      padding: 60px 24px 80px;
      background: linear-gradient(180deg, #FFFDF5 0%, #FEF9E7 100%);
      text-align: center;
    }
    .impact-card {
      max-width: 1280px; margin: 0 auto;
      background: white; border-radius: 24px;
      box-shadow: 0 4px 24px rgba(139, 105, 20, 0.08);
      padding: 48px 40px 40px;
      border: 1px solid #FBEDBB;
      transition: all 0.4s;
    }
    .impact-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px; margin-bottom: 32px;
    }
    .impact-item {
      padding: 24px; background: #FFFDF5;
      border: 1px solid #FBEDBB; border-radius: 16px;
      text-align: center;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 32px rgba(139, 105, 20, 0.15);
        border-color: #D4A017;
        .impact-icon { animation: iconBounce 0.7s ease; }
      }
    }
    .impact-icon {
      width: 56px; height: 56px; border-radius: 14px;
      margin: 0 auto 16px; display: grid; place-items: center;
      mat-icon { font-size: 28px; height: 28px; width: 28px; }
    }
    .impact-stat {
      font-size: 2rem; font-weight: 800; color: #78350F;
      letter-spacing: -0.02em; line-height: 1;
      margin-bottom: 6px;
      font-variant-numeric: tabular-nums;
    }
    .stat-suffix {
      display: inline-block; margin-left: 2px;
      &.plus { animation: blink 1.4s ease-in-out infinite; }
    }
    .impact-label { font-size: 0.82rem; color: #6B7280; font-weight: 500; }
    .impact-actions { display: flex; justify-content: flex-end; }
    .impact-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #8B6914; text-decoration: none;
      font-weight: 700; font-size: 0.88rem;
      transition: all 0.25s;
      &:hover { color: #D4A017; mat-icon { transform: translateX(4px); } }
      mat-icon { font-size: 18px; height: 18px; width: 18px; transition: transform 0.25s; }
    }

    /* ═══════════ GALLERY ═══════════ */
    .gallery { padding: 80px 0 60px; background: #F8F9FA; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .gallery-card {
      position: relative; height: 180px; border-radius: 14px; overflow: hidden;
      background-size: cover; background-position: center; cursor: pointer;
      transition: transform 0.35s, box-shadow 0.35s;
      &:hover {
        transform: translateY(-6px);
        .play-btn { background: #FDB913; color: #5C2E0E; scale: 1.1; }
        .play-btn::after { animation: ring 1.4s ease-out infinite; }
      }
    }
    .gallery-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%);
    }
    .gallery-date {
      position: absolute; top: 12px; right: 12px;
      padding: 4px 10px; background: rgba(0,0,0,0.55);
      color: white; border-radius: 999px;
      font-size: 0.68rem; font-weight: 700; z-index: 2;
    }
    .play-btn {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 48px; height: 48px; border-radius: 50%; border: none;
      background: rgba(255,255,255,0.9); color: #78350F;
      cursor: pointer; display: grid; place-items: center;
      transition: all 0.25s, scale 0.3s; z-index: 2;
      mat-icon { font-size: 26px; height: 26px; width: 26px; margin-left: 2px; }
      &::after {
        content: ''; position: absolute; inset: -6px; border-radius: 50%;
        border: 2px solid #FDB913; opacity: 0; pointer-events: none;
      }
    }
    .gallery-caption {
      position: absolute; left: 16px; right: 16px; bottom: 14px;
      color: white; font-size: 0.85rem; font-weight: 600;
      line-height: 1.3; z-index: 2; text-align: left;
    }
    .gallery-actions { margin-top: 32px; display: flex; justify-content: center; }
    .outline-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 26px; background: #FFFFFF;
      border: 1px solid #E5E7EB; border-radius: 999px;
      color: #78350F; text-decoration: none;
      font-weight: 700; font-size: 0.85rem;
      cursor: pointer; font-family: inherit;
      transition: all 0.25s;
      &:hover {
        border-color: #FDB913; color: #B8860B;
        box-shadow: 0 4px 16px rgba(253, 185, 19, 0.15);
      }
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }

    /* ═══════════ CTA (with radiating-line canvas) ═══════════ */
    .cta {
      position: relative; overflow: hidden;
      padding: 80px 24px 260px;
      background: linear-gradient(180deg, #FFFDF5 0%, #FEF9E7 100%);
      text-align: center;
      h2 { font-size: 2rem; font-weight: 800; color: #78350F; margin: 0 0 8px; }
      p { color: #8B6914; font-size: 1rem; margin: 0 0 24px; }
      > h2, > p, > button { position: relative; z-index: 1; }
    }
    .burst-canvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 0;
    }

    /* ═══════════ FOOTER ═══════════ */
    .site-footer {
      background: linear-gradient(180deg, #78350F 0%, #5C2E0E 100%);
      color: rgba(255,255,255,0.78);
    }
    .footer-inner {
      max-width: 1400px; margin: 0 auto;
      padding: 40px 24px 32px;
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr;
      gap: 32px;
      align-items: start;
    }
    .footer-col h4 {
      color: #FDB913; font-size: 0.9rem;
      font-weight: 800; margin: 0 0 14px; letter-spacing: 0.02em;
    }
    .contact-col .footer-address {
      margin: 0 0 12px;
      font-size: 0.8rem;
      line-height: 1.6;
      color: rgba(255,255,255,0.72);
    }
    .footer-list {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 8px;
      li {
        display: flex; align-items: flex-start; gap: 8px;
        font-size: 0.8rem;
        transition: translate 0.25s ease;
        &:hover { translate: 4px 0; }
        mat-icon {
          font-size: 15px; height: 15px; width: 15px;
          color: #FDB913; flex-shrink: 0;
          margin-top: 2px;
        }
        a {
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          transition: color 0.15s;
          line-height: 1.45;
          &:hover { color: #FDB913; }
        }
      }
      &.compact li a {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }
    }

    .view-more {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 10px;
      background: transparent;
      border: none;
      padding: 0;
      color: #FDB913;
      font-weight: 700;
      font-size: 0.76rem;
      letter-spacing: 0.02em;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      &:hover {
        color: #FCD34D;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      mat-icon { font-size: 14px; height: 14px; width: 14px; }
    }

    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.15);
    }
    .footer-bottom-inner {
      max-width: 1400px; margin: 0 auto; padding: 18px 24px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; font-size: 0.75rem;
    }
    .footer-copy { color: rgba(255,255,255,0.65); }
    .footer-social {
      display: flex; gap: 8px;
      a {
        width: 32px; height: 32px; border-radius: 50%;
        background: rgba(255,255,255,0.08);
        display: grid; place-items: center;
        color: rgba(255,255,255,0.8);
        text-decoration: none; transition: all 0.25s;
        &:hover { background: #FDB913; color: #5C2E0E; transform: translateY(-3px) scale(1.08); }
        mat-icon { font-size: 15px; height: 15px; width: 15px; }
      }
    }

    /* ═══════════ FLOATING SETTINGS PILL ═══════════ */
    .floating-settings {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 500; display: flex; align-items: center; gap: 4px;
      padding: 6px 10px;
      background: linear-gradient(135deg, #78350F 0%, #5C2E0E 100%);
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(92, 46, 14, 0.4);
      border: 1px solid rgba(253, 185, 19, 0.25);
      button {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 6px 12px; border-radius: 999px; border: none;
        background: transparent; color: rgba(255,255,255,0.85);
        font-weight: 700; font-size: 0.72rem; letter-spacing: 0.05em;
        cursor: pointer; transition: all 0.2s;
        &:hover { background: rgba(255,255,255,0.1); color: #FDB913; }
        &.active { background: #FDB913; color: #5C2E0E; }
        mat-icon { font-size: 16px; height: 16px; width: 16px; }
        .flag { font-size: 0.85rem; }
      }
      .divider { width: 1px; height: 18px; background: rgba(255,255,255,0.15); margin: 0 4px; }
    }

    /* ═══════════ SCROLL TOP ═══════════ */
    .scroll-top {
      position: fixed; right: 24px; bottom: 24px; z-index: 500;
      width: 48px; height: 48px; border-radius: 50%;
      border: 2px solid #FDB913; background: #FFFFFF;
      color: #78350F; cursor: pointer;
      display: grid; place-items: center;
      box-shadow: 0 8px 24px rgba(120, 53, 15, 0.25);
      transition: all 0.25s;
      animation: fadeUp 0.3s ease;
      &:hover { background: #FDB913; color: #5C2E0E; transform: translateY(-2px); mat-icon { animation: nudgeUp 0.9s ease-in-out infinite; } }
      mat-icon { font-size: 26px; height: 26px; width: 26px; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ══════════════════════════════════════════════════
       DARK MODE
       ══════════════════════════════════════════════════ */
    .landing.dark { background: #15100A; color: #EFE6D5; }

    .landing.dark .utility-bar {
      background: linear-gradient(90deg, #2A1A0F 0%, #3B2413 100%);
      border-bottom: 1px solid rgba(253, 185, 19, 0.12);
    }

    .landing.dark .main-header {
      background-color: #1A130D;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='140' viewBox='0 0 260 140'><g fill='none' stroke='%23FDB913' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' opacity='0.18'><g transform='translate(15,10)'><rect x='0' y='0' width='26' height='18' rx='2'/><line x1='5' y1='0' x2='5' y2='18'/><line x1='10' y1='0' x2='10' y2='18'/><line x1='15' y1='0' x2='15' y2='18'/><line x1='20' y1='0' x2='20' y2='18'/></g><g transform='translate(60,15)'><rect x='0' y='6' width='22' height='16' rx='1.5'/><path d='M4 6 L6 -2 L16 -2 L18 6'/></g><g transform='translate(105,10)'><rect x='0' y='0' width='30' height='20' rx='1.5'/><line x1='0' y1='15' x2='30' y2='15'/><circle cx='26' cy='17.5' r='0.8'/></g><g transform='translate(150,20)'><rect x='0' y='0' width='10' height='16' rx='1.5'/><line x1='3.5' y1='13' x2='6.5' y2='13'/></g><g transform='translate(180,12)'><rect x='0' y='0' width='34' height='14' rx='1'/><line x1='4' y1='7' x2='30' y2='7'/></g><g transform='translate(230,15)'><rect x='0' y='0' width='20' height='16' rx='1.5'/><line x1='0' y1='5' x2='20' y2='5'/><line x1='0' y1='11' x2='20' y2='11'/></g><g transform='translate(20,75)'><rect x='0' y='0' width='28' height='20' rx='1.5'/><rect x='4' y='4' width='20' height='12'/><line x1='14' y1='20' x2='14' y2='26'/><line x1='7' y1='26' x2='21' y2='26'/></g><g transform='translate(70,80)'><circle cx='9' cy='9' r='9'/><path d='M4.5 4.5 L13.5 13.5'/><path d='M13.5 4.5 L4.5 13.5'/></g><g transform='translate(115,75)'><path d='M3 12 L3 6 A9 9 0 0 1 21 6 L21 12'/><rect x='0' y='12' width='5' height='7' rx='1'/><rect x='19' y='12' width='5' height='7' rx='1'/></g><g transform='translate(160,80)'><rect x='0' y='0' width='16' height='22' rx='2'/><rect x='3' y='4' width='10' height='10'/><circle cx='8' cy='18' r='1'/></g><g transform='translate(195,78)'><rect x='0' y='0' width='22' height='14' rx='1'/><path d='M4 3 L4 8 M8 3 L8 8 M12 3 L12 8 M16 3 L16 8'/></g><g transform='translate(235,80)'><path d='M2 4 L2 16 L22 16 L22 4 Z'/><path d='M7 4 L7 8 L17 8 L17 4'/></g></g></svg>");
      background-repeat: repeat;
      background-size: 260px 140px;
      background-position: center;
      border-bottom: 1px solid rgba(253, 185, 19, 0.15);
    }
    .landing.dark .header-country { color: #D4A017; letter-spacing: 0.16em; }
    .landing.dark .header-title {
      color: #FDB913;
      text-shadow: 0 0 24px rgba(253, 185, 19, 0.2);
    }
    .landing.dark .header-sub { color: #B8A382; }

    .landing.dark .primary-nav {
      background: linear-gradient(90deg, #2A1A0F 0%, #3B2413 100%);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(253, 185, 19, 0.08) inset;
    }
    .landing.dark .dropdown {
      background: #221709;
      border-color: rgba(253, 185, 19, 0.2);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
      li a {
        color: #B8A382;
        &:hover {
          background: rgba(253, 185, 19, 0.1);
          color: #FDB913;
        }
      }
    }
    .landing.dark .ticker {
      background: linear-gradient(90deg, #2A1A0F 0%, #0F0906 100%);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(253, 185, 19, 0.15) inset;
    }
    .landing.dark .hero-overlay {
      background: linear-gradient(90deg,
        rgba(15, 9, 6, 0.96) 0%,
        rgba(23, 16, 11, 0.82) 45%,
        rgba(23, 16, 11, 0.55) 100%);
    }

    .landing.dark .featured { background: #1A130D; }
    .landing.dark .verify {
      background: radial-gradient(ellipse at 50% 0%, rgba(253, 185, 19, 0.05) 0%, transparent 55%), #15100A;
    }
    .landing.dark .notices {
      background: radial-gradient(ellipse at 50% 50%, rgba(253, 185, 19, 0.06) 0%, transparent 60%), #1A130D;
    }
    .landing.dark .gallery {
      background: radial-gradient(ellipse at 50% 100%, rgba(253, 185, 19, 0.06) 0%, transparent 55%), #1A130D;
    }
    .landing.dark .impact {
      background: radial-gradient(ellipse at 50% 0%, rgba(253, 185, 19, 0.08) 0%, transparent 60%), linear-gradient(180deg, #1A130D 0%, #221709 100%);
    }
    .landing.dark .cta {
      background: radial-gradient(ellipse at 50% 100%, rgba(253, 185, 19, 0.1) 0%, transparent 65%), linear-gradient(180deg, #221709 0%, #1A130D 100%);
    }

    .landing.dark .section-title {
      color: #FBF6EC;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
      .accent { color: #FDB913; text-shadow: 0 0 30px rgba(253, 185, 19, 0.35); }
    }
    .landing.dark .section-subtitle { color: #B8A382; }
    .landing.dark .section-badge {
      background: rgba(253, 185, 19, 0.1);
      border: 1px solid rgba(253, 185, 19, 0.3);
      color: #FDB913;
      box-shadow: 0 0 20px rgba(253, 185, 19, 0.12);
    }
    .landing.dark .section-underline {
      background: linear-gradient(90deg, #FDB913 0%, #B8860B 100%);
      box-shadow: 0 0 16px rgba(253, 185, 19, 0.5);
    }

    .landing.dark .notice-item {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(253, 185, 19, 0.15);
      color: #EFE6D5;
      &:hover {
        background: rgba(253, 185, 19, 0.08);
        border-color: rgba(253, 185, 19, 0.4);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), 0 0 32px rgba(253, 185, 19, 0.12);
      }
    }
    .landing.dark .notice-date { color: #FDB913; }
    .landing.dark .notice-title { color: #D9C9AC; }
    .landing.dark .notice-arrow { color: #FDB913; }

    .landing.dark .impact-card {
      background: linear-gradient(180deg, #221709 0%, #2A1D0E 100%);
      border: 1px solid rgba(253, 185, 19, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(253, 185, 19, 0.05) inset, 0 0 80px rgba(253, 185, 19, 0.06);
    }
    .landing.dark .impact-item {
      background: rgba(253, 185, 19, 0.03);
      border: 1px solid rgba(253, 185, 19, 0.15);
      &:hover {
        background: rgba(253, 185, 19, 0.08);
        border-color: rgba(253, 185, 19, 0.4);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(253, 185, 19, 0.15);
      }
    }
    .landing.dark .impact-stat { color: #FDB913; text-shadow: 0 0 24px rgba(253, 185, 19, 0.3); }
    .landing.dark .impact-label { color: #B8A382; }
    .landing.dark .impact-link { color: #FCD34D; &:hover { color: #FDB913; text-shadow: 0 0 16px rgba(253, 185, 19, 0.5); } }

    .landing.dark .featured-card,
    .landing.dark .verify-card,
    .landing.dark .gallery-card {
      border: 1px solid rgba(253, 185, 19, 0.1);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
      &:hover {
        border-color: rgba(253, 185, 19, 0.4);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65), 0 0 60px rgba(253, 185, 19, 0.18);
      }
    }

    .landing.dark .tab-pill {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(253, 185, 19, 0.18);
      color: #B8A382;
      &:hover {
        background: rgba(253, 185, 19, 0.08);
        border-color: rgba(253, 185, 19, 0.45);
        color: #FCD34D;
      }
      &.active {
        background: linear-gradient(135deg, #B8860B 0%, #78350F 100%);
        border-color: #FDB913;
        color: #FFFFFF;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(253, 185, 19, 0.5), 0 0 40px rgba(253, 185, 19, 0.25);
      }
    }

    .landing.dark .outline-btn {
      background: rgba(253, 185, 19, 0.05);
      border: 1px solid rgba(253, 185, 19, 0.3);
      color: #FDB913;
      &:hover {
        background: rgba(253, 185, 19, 0.12);
        border-color: #FDB913;
        color: #FCD34D;
        box-shadow: 0 8px 28px rgba(253, 185, 19, 0.25);
      }
    }

    .landing.dark .cta h2 { color: #FDB913; text-shadow: 0 0 40px rgba(253, 185, 19, 0.35); }
    .landing.dark .cta p { color: #B8A382; }

    .landing.dark .site-footer {
      background: linear-gradient(180deg, #1A120C 0%, #0B0705 100%);
      border-top: 1px solid rgba(253, 185, 19, 0.12);
    }
    .landing.dark .footer-bottom {
      border-top-color: rgba(253, 185, 19, 0.1);
      background: rgba(0, 0, 0, 0.4);
    }

    .landing.dark .scroll-top {
      background: rgba(253, 185, 19, 0.1);
      color: #FDB913;
      border: 2px solid #FDB913;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 32px rgba(253, 185, 19, 0.35);
      &:hover {
        background: #FDB913;
        color: #15100A;
        box-shadow: 0 12px 40px rgba(253, 185, 19, 0.55);
      }
    }

    .landing.dark .floating-settings {
      background: linear-gradient(135deg, #2A1A0F 0%, #0B0705 100%);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(253, 185, 19, 0.2) inset;
    }

    .landing.dark .a11y-panel {
      background: #1A130D;
      color: #EFE6D5;
      border-left: 1px solid rgba(253, 185, 19, 0.15);
    }
    .landing.dark .a11y-head { border-bottom-color: rgba(253, 185, 19, 0.15); }
    .landing.dark .a11y-logo {
      background: rgba(253, 185, 19, 0.12);
      color: #FDB913;
      box-shadow: 0 0 20px rgba(253, 185, 19, 0.15);
    }
    .landing.dark .a11y-section { border-bottom-color: rgba(253, 185, 19, 0.12); }
    .landing.dark .a11y-option {
      background: rgba(255, 255, 255, 0.03);
      border: 1.5px solid rgba(253, 185, 19, 0.15);
      color: #EFE6D5;
      &:hover {
        background: rgba(253, 185, 19, 0.08);
        border-color: rgba(253, 185, 19, 0.45);
      }
      &.active {
        background: rgba(253, 185, 19, 0.12);
        border-color: #FDB913;
        box-shadow: 0 0 0 1px rgba(253, 185, 19, 0.2);
      }
      mat-icon:not(.check) { color: #B8A382; }
      .check { color: #FDB913; }
    }
    .landing.dark .a11y-head h3 { color: #FBF6EC; }
    .landing.dark .a11y-head p { color: #8A7A62; }
    .landing.dark .a11y-close { color: #B8A382; }
    .landing.dark .a11y-close:hover { background: rgba(253, 185, 19, 0.12); color: #FDB913; }
    .landing.dark .a11y-footer { border-top-color: rgba(253, 185, 19, 0.15); background: #1A130D; }
    .landing.dark .a11y-label { color: #8A7A62; }
    .landing.dark .a11y-option .opt-text small { color: #8A7A62; }

    /* ── Accessibility panel base styles ── */
    .a11y-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 10, 6, 0.6);
      backdrop-filter: blur(3px);
      z-index: 1200; opacity: 0; pointer-events: none;
      transition: opacity 0.3s;
    }
    .a11y-backdrop.open { opacity: 1; pointer-events: auto; }

    .a11y-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 420px; max-width: 100vw;
      background: #FFFFFF; color: #1F2937;
      z-index: 1300; display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s;
      box-shadow: -8px 0 40px rgba(0,0,0,0.3);
    }
    .a11y-panel.open { transform: translateX(0); }

    .a11y-head {
      padding: 22px 24px;
      border-bottom: 1px solid #FBEDBB;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .a11y-head-left { display: flex; align-items: center; gap: 14px; }
    .a11y-logo {
      width: 44px; height: 44px; border-radius: 12px;
      background: #FEF9E7; color: #8B6914;
      display: grid; place-items: center;
      mat-icon { font-size: 24px; height: 24px; width: 24px; }
    }
    .a11y-head h3 {
      margin: 0; font-size: 1.05rem; font-weight: 800; color: #1F2937;
      .shortcut { font-size: 0.75rem; font-weight: 700; color: #9CA3AF; margin-left: 4px; }
    }
    .a11y-head p { margin: 2px 0 0; font-size: 0.78rem; color: #6B7280; }
    .a11y-close {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: transparent; color: #6B7280;
      cursor: pointer; display: grid; place-items: center; transition: all 0.2s;
      &:hover { background: #FEF9E7; color: #8B6914; }
      mat-icon { font-size: 20px; height: 20px; width: 20px; }
    }

    .a11y-body { flex: 1; overflow-y: auto; padding: 4px 24px 24px; }
    .a11y-section { padding: 20px 0; border-bottom: 1px solid #FBEDBB; }
    .a11y-section:last-child { border-bottom: none; }
    .a11y-label {
      font-size: 0.7rem; font-weight: 800;
      letter-spacing: 0.12em; color: #6B7280;
      text-transform: uppercase; margin-bottom: 12px;
    }

    .a11y-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .a11y-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .a11y-grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }

    .a11y-option {
      position: relative;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px;
      background: #FFFFFF;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px; color: #1F2937;
      cursor: pointer; transition: all 0.25s ease;
      font-family: inherit; text-align: left;
      &:hover { border-color: #8B6914; background: #FEF9E7; }
      &.active { border-color: #8B6914; background: #FEF9E7; }
      mat-icon:not(.check) {
        font-size: 20px; height: 20px; width: 20px; color: #6B7280;
      }
      &.col {
        flex-direction: column; align-items: center; justify-content: center;
        padding: 14px 8px; gap: 6px;
        font-size: 0.78rem; font-weight: 600;
        span { text-align: center; line-height: 1.2; }
      }
      &.wide { width: 100%; padding: 14px 16px; gap: 14px; }
      .flag-big { font-size: 1.4rem; }
      .opt-text {
        display: flex; flex-direction: column; line-height: 1.2; flex: 1;
        strong { font-size: 0.85rem; font-weight: 700; }
        small { font-size: 0.72rem; color: #6B7280; margin-top: 2px; }
      }
      .check {
        position: absolute; top: 8px; right: 8px;
        font-size: 18px; height: 18px; width: 18px;
        color: #8B6914;
      }
      &.col .check { top: 6px; right: 6px; }
    }

    .a11y-reset {
      width: 100%; padding: 12px 20px;
      background: linear-gradient(135deg, #B8860B 0%, #8B6914 100%);
      color: white; border: none; border-radius: 10px;
      font-weight: 700; font-size: 0.85rem; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.25s;
      &:hover {
        background: linear-gradient(135deg, #8B6914 0%, #5C2E0E 100%);
        box-shadow: 0 4px 16px rgba(139, 105, 20, 0.3);
      }
      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }
    .a11y-footer {
      padding: 16px 24px;
      border-top: 1px solid #FBEDBB;
      background: #FFFFFF;
    }

    /* ══════════════════════════════════════════════════
       MOTION  (animations only — no colours changed)
       ══════════════════════════════════════════════════ */
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }

    /* Scroll reveal (see Reveal directive). Uses translate/scale properties so
       it never fights with the hover transforms already on these elements. */
    [reveal] { opacity: 0; translate: 0 32px; }
    [reveal].revealed {
      opacity: 1; translate: 0 0;
      animation: revealUp 0.85s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
      animation-delay: var(--rd, 0ms);
    }
    [reveal='line'] { opacity: 1; translate: none; scale: 0 1; }
    [reveal='line'].revealed {
      scale: 1 1; translate: none;
      animation: lineGrow 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
      animation-delay: var(--rd, 0ms);
    }

    /* Page-load entrances */
    .header-emblem, .header-logo { animation: popIn 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.1s backwards; }
    .header-country { animation: dropIn 0.7s ease 0.15s backwards; }
    .header-title { animation: dropIn 0.8s ease 0.28s backwards; }
    .header-sub { animation: dropIn 0.8s ease 0.42s backwards; }
    .ticker { animation: tickerIn 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.25s backwards; }
    .floating-settings { animation: pillIn 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.8s backwards; }

    /* Nav hover underline */
    .nav-link::after {
      content: ''; position: absolute; left: 14px; right: 14px; bottom: 9px; height: 2px;
      background: #FDB913; border-radius: 2px;
      scale: 0 1; transform-origin: left center;
      transition: scale 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .nav-link:hover::after { scale: 1 1; }

    /* Hero — staggered entrance */
    .cursor {
      display: inline-block; width: 3px; height: 0.9em; margin-left: 4px;
      background: #FDB913; vertical-align: -0.06em;
      animation: caret 0.9s steps(1) infinite;
    }
    .hero-text .hero-accent-line {
      transform-origin: left center;
      animation: lineGrow 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.2s backwards;
    }
    .hero-text .hero-sub { animation: heroUp 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.45s backwards; }
    .hero-text .hero-cta { animation: heroUp 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.7s backwards; }

    /* Keyframes */
    @keyframes revealUp {
      from { opacity: 0; translate: 0 32px; }
      to   { opacity: 1; translate: 0 0; }
    }
    @keyframes lineGrow { from { scale: 0 1; } to { scale: 1 1; } }
    @keyframes heroUp {
      from { opacity: 0; translate: 0 26px; }
      to   { opacity: 1; translate: 0 0; }
    }
    @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.09); } }
    @keyframes caret { 50% { opacity: 0; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
    @keyframes marquee { to { transform: translateX(-33.3333%); } }
    @keyframes nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
    @keyframes nudgeUp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes ring {
      0%   { scale: 0.85; opacity: 0.9; }
      100% { scale: 1.55; opacity: 0; }
    }
    @keyframes iconBounce {
      0%, 100% { scale: 1; rotate: 0deg; }
      30% { scale: 1.18; rotate: -8deg; }
      60% { scale: 1.05; rotate: 6deg; }
    }
    @keyframes popIn {
      from { opacity: 0; scale: 0.7; }
      to   { opacity: 1; scale: 1; }
    }
    @keyframes dropIn {
      from { opacity: 0; translate: 0 -10px; }
      to   { opacity: 1; translate: 0 0; }
    }
    @keyframes tickerIn {
      from { opacity: 0; translate: 0 -16px; scale: 0.97; }
      to   { opacity: 1; translate: 0 0; scale: 1; }
    }
    @keyframes pillIn {
      from { opacity: 0; translate: 0 36px; }
      to   { opacity: 1; translate: 0 0; }
    }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 1200px) {
      .nav-links .nav-item:nth-child(n+6) { display: none; }
    }
    @media (max-width: 1024px) {
      .nav-links .nav-item:nth-child(n+5) { display: none; }
      .footer-inner { grid-template-columns: 1fr 1fr; gap: 28px; }
    }
    @media (max-width: 860px) {
      .nav-links { display: none; }
      .nav-inner { justify-content: flex-end; }
      .nav-mini-logo { display: none; }
      .header-inner { grid-template-columns: 90px 1fr 140px; padding: 16px; }
      .header-emblem { height: 72px; width: 72px; }
      .header-logo { height: 48px; width: 140px; }
      .header-country { font-size: 0.6rem; }
      .header-sub { font-size: 0.62rem; }
      .footer-inner { grid-template-columns: 1fr; gap: 28px; padding: 32px 20px 24px; }
      .a11y-panel { width: 100vw; }
      .notice-item { grid-template-columns: 110px 1fr 24px; gap: 12px; padding: 12px 14px; }
      .notice-date { font-size: 0.7rem; }
      .notice-title { font-size: 0.82rem; }
    }
    @media (max-width: 600px) {
      .utility-inner { padding: 6px 14px; gap: 10px; }
      .utility-left .utility-item:nth-child(n+3) { display: none; }
      .utility-left .utility-item span { display: none; }
      .ticker-wrap { padding: 0 14px; margin-top: 12px; }
      .ticker { padding: 8px 12px; gap: 10px; }
      .ticker-text { font-size: 0.75rem; }
      .hero-slide { min-height: 440px; }
      .hero-content { padding: 48px 22px; }
      .hero-nav { display: none; }
      .header-inner { grid-template-columns: 70px 1fr 100px; padding: 12px; }
      .header-emblem { height: 56px; width: 56px; }
      .header-logo { height: 36px; width: 100px; }
      .nav-login span { display: none; }
      .nav-login { padding: 8px 10px; }
      .impact-card { padding: 32px 20px; }
      .footer-bottom-inner { justify-content: center; text-align: center; }
      .floating-settings { bottom: 92px; }
      .scroll-top { bottom: 20px; right: 20px; width: 44px; height: 44px; }
      .a11y-grid-4 { grid-template-columns: repeat(2, 1fr); }
      .a11y-grid-5 { grid-template-columns: repeat(3, 1fr); }
      .notice-item { grid-template-columns: 1fr; gap: 4px; text-align: left; }
      .notice-arrow { display: none; }
      .featured-card { flex-basis: 240px; height: 240px; }
      .cta { padding-bottom: 220px; }
    }

    /* Respect users who prefer reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
      }
      [reveal] { opacity: 1; translate: none; }
      [reveal='line'] { scale: 1 1; }
      .featured-track { animation: none !important; }
      .featured-scroller { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
      .hero-bg.active { animation: none; }
    }

    /* ═══════════ MODERN PUBLIC PORTAL FINISH ═══════════ */
    .landing {
      --portal-ink: #17243a;
      --portal-muted: #68788c;
      --portal-gold: #f4bd45;
      --portal-navy: #132640;
      background: #f7f9fc;
      color: var(--portal-ink);
    }
    .utility-bar {
      background: linear-gradient(100deg, #102139 0%, #173552 100%);
      box-shadow: none;
      border-bottom-color: rgba(255,255,255,.08);
    }
    .utility-inner { min-height: 42px; padding-top: 5px; padding-bottom: 5px; }
    .utility-item { color: #c6d4e2; }
    .utility-item:hover, .utility-item:hover mat-icon { color: #f4bd45; }
    .lang-switch { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.1); }
    .lang-btn { color: #bdcbd9; }
    .lang-btn.active { background: #f4bd45; color: #17243a; box-shadow: 0 3px 10px rgba(244,189,69,.2); }
    .util-icon { width: 32px; height: 32px; background: rgba(255,255,255,.06); }
    .main-header {
      background-color: #fff;
      background-image:
        radial-gradient(ellipse at 92% 0%, rgba(52,121,177,.08), transparent 40%),
        linear-gradient(110deg, transparent 55%, rgba(244,189,69,.05));
      border-bottom-color: rgba(22,48,76,.08);
    }
    .header-inner { max-width: 1440px; padding-top: 16px; padding-bottom: 16px; }
    .header-emblem { height: 82px; width: 82px; filter: drop-shadow(0 5px 10px rgba(23,36,58,.08)); }
    .header-logo { height: 52px; }
    .header-country { color: #8b6914; letter-spacing: .17em; font-size: .65rem; }
    .header-title { color: #162c47; letter-spacing: -.015em; }
    .header-sub { color: #78889b; font-size: .68rem; }
    .primary-nav {
      background: linear-gradient(100deg, #132640 0%, #173858 100%);
      box-shadow: 0 8px 22px rgba(14,34,57,.12);
      border-bottom: 1px solid rgba(244,189,69,.35);
    }
    .primary-nav.stuck { box-shadow: 0 10px 28px rgba(14,34,57,.22); }
    .nav-inner { min-height: 56px; }
    .nav-link { color: rgba(244,248,252,.86); padding-top: 18px; padding-bottom: 18px; }
    .nav-link:hover { color: #f4bd45; background: rgba(255,255,255,.045); }
    .nav-link::after { background: #f4bd45; bottom: 8px; }
    .dropdown { border-color: rgba(22,48,76,.1); border-radius: 0 0 14px 14px; box-shadow: 0 18px 44px rgba(16,33,57,.18); }
    .dropdown li a:hover { background: #f3f7fb; color: #173858; border-left-color: #f4bd45; }
    .nav-search { background: rgba(255,255,255,.08); }
    .nav-login { background: #f4bd45; color: #17243a; }
    .nav-login:hover { background: #ffd36e; box-shadow: 0 6px 18px rgba(244,189,69,.22); }
    .ticker-wrap { max-width: 1440px; margin-top: 18px; }
    .ticker {
      min-height: 48px;
      background: linear-gradient(100deg, #173858, #20557a);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      box-shadow: 0 10px 25px rgba(20,48,76,.12);
    }
    .ticker-badge { background: #f4bd45; color: #17243a; }
    .ticker-badge .dot { background: #173858; }
    .ticker-date { color: #f8d88d; }
    .ticker-nav button { border-color: rgba(255,255,255,.16); }
    .ticker-nav button:hover { background: #f4bd45; color: #17243a; border-color: #f4bd45; }
    .hero-carousel {
      max-width: 1440px;
      margin: 18px auto 0;
      padding: 0 22px;
    }
    .hero-slide {
      min-height: clamp(470px, 42vw, 590px);
      border-radius: 26px;
      box-shadow: 0 24px 60px rgba(15,37,62,.2);
      isolation: isolate;
    }
    .hero-bg { border-radius: inherit; }
    .hero-overlay {
      border-radius: inherit;
      background:
        linear-gradient(90deg, rgba(12,28,49,.91) 0%, rgba(18,48,77,.74) 52%, rgba(20,52,81,.25) 100%),
        linear-gradient(0deg, rgba(10,27,47,.26), transparent 55%);
    }
    .hero-content { padding: clamp(56px, 7vw, 92px) clamp(30px, 6vw, 82px); }
    .hero-text { max-width: 670px; }
    .hero-title { font-size: clamp(2.2rem, 4.6vw, 3.8rem); letter-spacing: -.045em; line-height: 1.06; }
    .hero-title .accent { color: #f5c65e; }
    .hero-accent-line { width: 54px; height: 3px; background: #f4bd45; }
    .hero-sub { max-width: 570px; color: rgba(245,249,253,.84); font-size: 1.02rem; }
    .hero-cta {
      padding: 13px 24px;
      color: #17243a;
      background: #f4bd45;
      border: 1px solid #f4bd45;
      box-shadow: 0 10px 26px rgba(5,17,31,.23);
      letter-spacing: .035em;
    }
    .hero-cta:hover, .hero-cta.solid { background: #ffd36e; color: #17243a; border-color: #ffd36e; }
    .hero-nav { background: rgba(10,28,49,.3); border-color: rgba(255,255,255,.3); }
    .hero-nav:hover { background: #f4bd45; color: #17243a; border-color: #f4bd45; }
    .hero-dots .dot.active { background: #f4bd45; }
    .section-inner { max-width: 1320px; }
    .section-badge {
      padding: 7px 14px;
      background: #eef4fa;
      border-color: #dce7f1;
      color: #315572;
      letter-spacing: .12em;
    }
    .section-title { color: #17243a; letter-spacing: -.04em; }
    .section-title .accent { color: #aa7918; }
    .section-underline { height: 3px; background: linear-gradient(90deg, #f4bd45, #3e8ab5); }
    .section-subtitle { color: #718096; }
    .featured { background: #f7f9fc; padding: 76px 0 52px; }
    .featured-card, .verify-card { border-radius: 20px; box-shadow: 0 8px 26px rgba(22,43,66,.12); }
    .featured-card:hover { box-shadow: 0 24px 50px rgba(17,43,70,.25); }
    .featured-overlay { background: linear-gradient(180deg, rgba(13,32,53,0) 24%, rgba(13,32,53,.91) 100%); }
    .verify { background: radial-gradient(ellipse at 50% 0%, rgba(58,123,172,.05), transparent 55%), #fff; }
    .notices { background: linear-gradient(180deg, #f3f7fb 0%, #f7f9fc 100%); }
    .notices-list { gap: 10px; max-width: 980px; }
    .notice-item {
      padding: 17px 20px;
      border-color: rgba(23,56,88,.09);
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(22,43,66,.035);
    }
    .notice-item:hover {
      border-color: rgba(46,112,159,.25);
      background: #fff;
      box-shadow: 0 12px 24px rgba(22,43,66,.08);
      transform: translateY(-2px);
    }
    .notice-date { color: #8b6914; }
    .notice-title { color: #34465c; }
    .impact { background: #f3f7fb; }
    .impact-card {
      border-color: rgba(23,56,88,.1);
      border-radius: 26px;
      box-shadow: 0 16px 46px rgba(22,43,66,.08);
    }
    .impact-item { background: #f7f9fc; border-color: rgba(23,56,88,.08); border-radius: 18px; }
    .cta {
      padding: 72px 24px 88px;
      background: linear-gradient(180deg, #f3f7fb, #eaf1f7);
    }
    .cta h2 { color: #172b44; letter-spacing: -.04em; }
    .cta p { color: #68788c; }
    .site-footer {
      background: linear-gradient(145deg, #102139 0%, #142d48 62%, #173858 100%);
      border-top: 3px solid #f4bd45;
    }
    .footer-inner {
      max-width: 1440px;
      padding: 52px 28px 42px;
      grid-template-columns: 1.45fr 1fr 1fr 1fr;
      gap: clamp(22px, 3vw, 44px);
    }
    .footer-col h4 {
      position: relative;
      padding-bottom: 12px;
      color: #f4bd45;
      font-size: .8rem;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .footer-col h4::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 30px;
      height: 2px;
      border-radius: 2px;
      background: #f4bd45;
    }
    .contact-col .footer-address { color: #c0cedc; }
    .footer-list li { color: #b8c8d8; }
    .footer-list li mat-icon { color: #f4bd45; }
    .footer-list li a { color: #c0cedc; }
    .footer-list li a:hover { color: #f4bd45; }
    .footer-list.compact li a {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      overflow-wrap: anywhere;
      max-width: none;
    }
    .view-more { color: #f4bd45; }
    .footer-bottom { background: rgba(6,17,29,.34); border-top-color: rgba(255,255,255,.1); }
    .footer-bottom-inner { max-width: 1440px; padding: 18px 28px; }
    .footer-copy { color: #aebfd0; line-height: 1.5; }
    .footer-social a { background: rgba(255,255,255,.08); color: #d8e2ec; }
    .footer-social a:hover { background: #f4bd45; color: #17243a; }
    .floating-settings {
      background: linear-gradient(125deg, #132640, #173858);
      box-shadow: 0 12px 34px rgba(13,32,53,.28);
      border-color: rgba(244,189,69,.28);
    }
    .floating-settings button.active { background: #f4bd45; color: #17243a; }
    .scroll-top {
      color: #17243a;
      border: 1px solid rgba(23,56,88,.12);
      background: #fff;
      box-shadow: 0 12px 28px rgba(13,32,53,.17);
    }
    .scroll-top:hover { background: #f4bd45; color: #17243a; border-color: #f4bd45; }
    .landing.dark {
      --portal-ink: #edf3f9;
      --portal-muted: #aab8c8;
      background: #101a29;
      color: #edf3f9;
    }
    .landing.dark .utility-bar,
    .landing.dark .primary-nav { background: linear-gradient(100deg, #101b2b, #142a41); }
    .landing.dark .main-header {
      background-color: #121e2f;
      background-image: radial-gradient(ellipse at 92% 0%, rgba(62,138,181,.11), transparent 42%);
      border-bottom-color: rgba(255,255,255,.07);
    }
    .landing.dark .header-country { color: #d6ad53; }
    .landing.dark .header-title { color: #f2f5f9; text-shadow: none; }
    .landing.dark .header-sub { color: #9bacc0; }
    .landing.dark .ticker { background: linear-gradient(100deg, #172d45, #1b3b56); }
    .landing.dark .hero-overlay {
      background: linear-gradient(90deg, rgba(8,19,33,.94), rgba(13,35,58,.78) 55%, rgba(14,39,62,.38));
    }
    .landing.dark .featured,
    .landing.dark .notices,
    .landing.dark .impact,
    .landing.dark .verify,
    .landing.dark .gallery {
      background-color: #101a29;
      background-image: radial-gradient(ellipse at 50% 0%, rgba(58,123,172,.08), transparent 58%);
    }
    .landing.dark .section-title { color: #edf3f9; text-shadow: none; }
    .landing.dark .section-title .accent { color: #f4bd45; text-shadow: none; }
    .landing.dark .section-subtitle { color: #aab8c8; }
    .landing.dark .section-badge { background: rgba(244,189,69,.08); border-color: rgba(244,189,69,.2); color: #f4bd45; box-shadow: none; }
    .landing.dark .section-underline { background: linear-gradient(90deg, #f4bd45, #3e8ab5); box-shadow: none; }
    .landing.dark .notice-item { background: #172436; border-color: rgba(211,226,240,.08); }
    .landing.dark .notice-item:hover { background: #1b2b40; border-color: rgba(244,189,69,.24); }
    .landing.dark .notice-title { color: #d2dce7; }
    .landing.dark .impact-card { background: #172436; border-color: rgba(211,226,240,.09); box-shadow: 0 16px 44px rgba(0,0,0,.22); }
    .landing.dark .impact-item { background: #1b2b40; border-color: rgba(211,226,240,.08); }
    .landing.dark .floating-settings { background: linear-gradient(125deg, #132640, #173858); }
    .landing.dark .cta {
      background: linear-gradient(180deg, #101a29, #14243a);
    }
    .landing.dark .cta h2 { color: #f2f5f9; text-shadow: none; }
    .landing.dark .cta p { color: #aab8c8; }
    .landing.dark .site-footer {
      background: linear-gradient(145deg, #0d1826 0%, #10243a 62%, #142e48 100%);
      border-top-color: rgba(244,189,69,.55);
    }
    .landing.dark .footer-bottom { background: rgba(0,0,0,.24); border-top-color: rgba(255,255,255,.08); }
    .landing.dark .footer-copy { color: #9bacc0; }
    @media (max-width: 860px) {
      .hero-carousel { padding: 0 14px; }
      .hero-slide { border-radius: 20px; }
      .header-inner { gap: 12px; }
    }
    @media (max-width: 600px) {
      .utility-inner { min-height: 38px; }
      .hero-carousel { margin-top: 12px; }
      .hero-slide { min-height: 440px; }
      .hero-content { padding: 46px 24px; }
      .hero-title { font-size: clamp(2rem, 9vw, 2.7rem); }
      .ticker { border-radius: 12px; }
      .featured { padding-top: 58px; }
      .notices, .impact { padding-top: 58px; padding-bottom: 58px; }
    }
    @media (max-width: 860px) {
      .footer-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 40px 24px 34px; }
      .contact-col { grid-column: 1 / -1; }
    }
    @media (max-width: 520px) {
      .footer-inner { grid-template-columns: 1fr; gap: 26px; padding: 36px 20px 30px; }
      .contact-col { grid-column: auto; }
      .footer-bottom-inner { padding: 16px 20px; }
      .footer-copy { font-size: .72rem; }
      .cta { padding: 58px 20px 72px; }
    }
    /* Accessibility settings alter semantic colors and text without filtering images or controls. */
    .landing.a11y-contrast-dark { background: #080d16; color: #fff; }
    .landing.a11y-contrast-dark :is(p, span, li, label, h1, h2, h3, h4, a, button, small, strong) { color: #fff; }
    .landing.a11y-contrast-dark :is(section, .main-header, .primary-nav, .site-footer, .notice-item, .impact-card, .impact-item, .a11y-panel) {
      background-color: #080d16;
      border-color: #d5e5ff;
    }
    .landing.a11y-contrast-dark :is(a, button):focus-visible { outline: 3px solid #ffdf00; outline-offset: 3px; }
    .landing.a11y-contrast-light { background: #fff; color: #000; }
    .landing.a11y-contrast-light :is(p, span, li, label, h1, h2, h3, h4, a, button, small, strong) { color: #000; }
    .landing.a11y-contrast-light :is(section, .main-header, .primary-nav, .site-footer, .notice-item, .impact-card, .impact-item, .a11y-panel) {
      background-color: #fff;
      border-color: #000;
    }
    .landing.a11y-contrast-light :is(a, button):focus-visible { outline: 3px solid #004b9b; outline-offset: 3px; }
    .landing.a11y-text-small { font-size: 90%; }
    .landing.a11y-text-large { font-size: 112.5%; }
    .landing.a11y-text-xlarge { font-size: 125%; }
    .landing.a11y-text-xxlarge { font-size: 140%; }
    .a11y-panel :is(button, a):focus-visible { outline: 3px solid #1672d4; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .a11y-panel, .a11y-backdrop { transition: none !important; } }
  `]
})
export class LandingPage implements OnInit, AfterViewInit, OnDestroy {

  private router = inject(Router);
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private theme = inject(ThemeService);
  private languageService = inject(LanguageService);

  @ViewChild('impactCard') impactCard?: ElementRef<HTMLElement>;
  @ViewChild('burstCanvas') burstCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('a11yPanel') a11yPanel?: ElementRef<HTMLElement>;

  readonly scrolled = signal(false);
  readonly navStuck = signal(false);
  readonly loginOpen = signal(false);
  readonly registerOpen = signal(false);          // ← ADD
  readonly closeTicker = signal(false);
  readonly darkMode = this.theme.dark;
  readonly a11yOpen = signal(false);
  readonly lang = this.languageService.language;
  readonly activeTab = signal(0);
  readonly currentIndex = signal(0);

  /* Typewriter state */
  readonly typedTitle = signal('');
  readonly typedAccent = signal('');
  readonly typingPhase = signal<'title' | 'accent' | 'done'>('title');

  /* View-more toggles */
  readonly noticesExpanded = signal(false);
  readonly zonesExpanded = signal(false);
  readonly relatedExpanded = signal(false);
  readonly quickExpanded = signal(false);

  readonly contrast = signal<'normal' | 'inverted' | 'dark' | 'light'>('normal');
  readonly textSize = signal<'normal' | 's' | 'l' | 'xl' | 'xxl'>('normal');
  readonly readAloud = signal(false);

  readonly textSizes = ['normal', 's', 'l', 'xl', 'xxl'] as const;

  readonly navItems: NavItem[] = [
    { label: 'Home', href: '#home' },
    {
      label: 'About Us', href: '#about',
      children: [
        { label: 'Background', href: '#' },
        { label: 'Vision and Mission', href: '#' },
        { label: 'Organization Structure', href: '#' },
        { label: 'Board Members', href: '#' },
        { label: 'Management', href: '#' },
      ],
    },
    {
      label: 'Procurement Standards', href: '#standards',
      children: [
        { label: 'Guidelines - English', href: '#' },
        { label: 'Guidelines - Swahili', href: '#' },
        { label: 'Procedural Forms', href: '#' },
        { label: 'Circulars', href: '#' },
      ],
    },
    {
      label: 'Our Services', href: '#services',
      children: [
        { label: 'Asset Register', href: '#' },
        { label: 'Reports & Analytics', href: '#' },
        { label: 'AI Assistant', href: '#' },
        { label: 'Verification', href: '#' },
      ],
    },
    {
      label: 'Media Centre', href: '#media',
      children: [
        { label: 'Photo Gallery', href: '#' },
        { label: 'Video Gallery', href: '#' },
        { label: 'Public Notice', href: '#' },
        { label: 'Newsletters', href: '#' },
      ],
    },
    {
      label: 'Publications', href: '#publications',
      children: [
        { label: 'Annual Performance Reports', href: '#' },
        { label: 'Audited Financial Report', href: '#' },
        { label: 'Tanzania Procurement Journal', href: '#' },
        { label: 'Blacklisted Firms', href: '#' },
      ],
    },
    { label: 'Contact Us', href: '#contact' },
  ];

  readonly slides: HeroSlide[] = [
    {
      title: 'UN AWARDS',
      titleAccent: 'NeST Recognized',
      subtitle: 'The National e-Procurement System of Tanzania (NeST) has been recognized by United Nations agencies at the Digital@UNGA2026 Awards as one of the top 15 government digital systems driving economic transformation in society.',
      cta: 'Read More',
      ctaLink: '#stats',
      image: 'https://www.ppra.go.tz/uploads/sliders/slider-1790172328.jpeg',
      align: 'left',
    },
    {
      title: 'A GOOD MEMORY',
      titleAccent: 'Performance Report',
      subtitle: 'The President of the United Republic of Tanzania, Her Excellency Dr. Samia Suluhu Hassan, receives the Performance Report of the Public Procurement Regulatory Authority (PPRA) for the 2024/2025 Financial Year from the Authority\'s Director General, Mr. Dennis Simba.',
      cta: 'Learn More',
      ctaLink: '#features',
      image: 'https://www.ppra.go.tz/uploads/sliders/slider-1788240040.png',
      align: 'left',
    },
    {
      title: 'PPRA Director General',
      titleAccent: 'Meets Ikupa Trust Fund',
      subtitle: 'PPRA Director General, Mr. Dennis Simba, chairs a meeting with leaders of the Ikupa Trust Fund at the PPRA Headquarters in Dodoma. The meeting discusses the empowerment of groups of persons with disabilities to enable them to benefit from public procurement opportunities.',
      cta: 'Discover More',
      ctaLink: '#features',
      image: 'https://www.ppra.go.tz/uploads/sliders/slider-1787927246.jpeg',
      align: 'left',
    },
    {
      title: 'Kizimkazi Festival',
      titleAccent: 'Certificate of Appreciation',
      subtitle: 'Her Excellency Dr. Samia Suluhu Hassan, President of the United Republic of Tanzania, presented a Certificate of Appreciation to the PPRA Director General, Mr. Dennis K. Simba, during the Kizimkazi Festival held in Zanzibar.',
      cta: 'View Details',
      ctaLink: '#features',
      image: 'https://www.ppra.go.tz/uploads/sliders/slider-1787036193.jpeg',
      align: 'left',
    },
    {
      title: 'In Remembrance',
      titleAccent: 'Condolence Visit',
      subtitle: 'The Director General of the Public Procurement Regulatory Authority (PPRA), Mr. Dennis Simba, together with other leaders, consoles Her Excellency Dr. Samia Suluhu Hassan, President of the United Republic of Tanzania, at her home in Kizimkazi, South Unguja Region, Zanzibar.',
      cta: 'Read More',
      ctaLink: '#features',
      image: 'https://www.ppra.go.tz/uploads/sliders/slider-1789061063.jpeg',
      align: 'left',
    },
  ];

  readonly features = [
    { title: 'NeST', image: 'https://www.ppra.go.tz/uploads/services/99443143a17f346cb9c1812c62c658a3.png' },
    { title: 'Monitoring Compliance', image: 'https://www.ppra.go.tz/uploads/services/058aaf82de50de70c89878801d415f6d.jpeg' },
    { title: 'Capacity Building', image: 'https://www.ppra.go.tz/uploads/services/36d85948a998a164ae03021694ffe1e8.jpeg' },
    { title: 'UN AWARDS', image: 'https://www.ppra.go.tz/uploads/news/c2af871cd924b6596e02ff45f64d1dd2.jpeg' },
  ];

  /** Three copies so the CSS marquee loops seamlessly (animates by exactly one third). */
  readonly marqueeItems = [...this.features, ...this.features, ...this.features];

  readonly tabs = ['SEARCH & VERIFY', 'SUBSECTOR', 'ASSET CATEGORIES', 'REPORTS', 'AI ASSISTANT'];

  readonly verifyCards = [
    { title: 'Search Asset', desc: 'Find any asset by tag, serial, or holder using our intelligent register.', image: 'https://www.ppra.go.tz/uploads/news/c2af871cd924b6596e02ff45f64d1dd2.jpeg' },
    { title: 'Verify Assignment', desc: 'Confirm who holds what — with a full chain of custody and audit trail.', image: 'https://www.ppra.go.tz/uploads/news/5cfa805071507b1cc77f48967a890355.jpeg' },
    { title: 'Certificate & Warranty Info', desc: 'Access the database of licensed assets with detailed warranty and service history.', image: 'https://www.ppra.go.tz/uploads/news/19bf0d929420275bce4791fd5a635b92.jpeg' },
    { title: 'Asset Verification', desc: 'Verify the authenticity and condition of every asset before transfer.', image: 'https://www.ppra.go.tz/uploads/services/99443143a17f346cb9c1812c62c658a3.png' },
    { title: 'Search Approved Devices', desc: 'List of approved ICT devices and their specifications.', image: 'https://www.ppra.go.tz/uploads/services/058aaf82de50de70c89878801d415f6d.jpeg' },
    { title: 'Asset Allocation Plan', desc: 'Open the asset allocation chart and browse the current allocation plan.', image: 'https://www.ppra.go.tz/uploads/services/36d85948a998a164ae03021694ffe1e8.jpeg' },
  ];

  readonly notices = [
    { date: '18th Sep 2026', title: 'Guidelines for Use of National Electronic Procurement System of Tanzania in Public Procurement and Supply Management, 2025' },
    { date: '18th Sep 2026', title: 'Procurement through the Constituency Development' },
    { date: '18th Sep 2026', title: 'Guidelines for Securities in Public Procurement, 2025' },
    { date: '18th Sep 2026', title: 'Guidelines for Tender Board\'s Decision Through Circular Resolution, 2025' },
    { date: '18th Sep 2026', title: 'General Guidelines for Sustainable Public Procurement, 2025' },
    { date: '18th Sep 2026', title: 'Guidelines for Procurement of Capital Equipment, Materials Products, and Related Services for the Development of Industries, 2025' },
    { date: '18th Sep 2026', title: 'Guidelines for Procurement of Goods or Services Directly from Manufacturers, Service Providers, or Authorized Dealers, 2025' },
    { date: '18th Sep 2026', title: 'Guidelines for Price Adjustment in Public Procurement, 2026' },
    { date: '18th Sep 2026', title: 'Guidelines for Preparing and Submitting Responsive Tenders, 2026' },
    { date: '18th Sep 2026', title: 'Guidelines for Application of Preference Scheme in Public Procurement, 2025' },
  ];

  readonly stats = [
    { icon: 'inventory_2', value: '2,500+', label: 'Registered Assets', bg: '#EFF6FF', color: '#0066CC' },
    { icon: 'verified_user', value: '250+', label: 'Active Users', bg: '#FEF3C7', color: '#D97706' },
    { icon: 'assignment_ind', value: '1,890+', label: 'Assigned Today', bg: '#DCFCE7', color: '#15803D' },
    { icon: 'analytics', value: '100%', label: 'Digital Tracking', bg: '#EEF2FF', color: '#4F46E5' },
  ];

  /** Animated display values for the impact numbers (counts up from 0 when scrolled into view). */
  readonly statDisplay = signal(
    this.stats.map(s => ({ value: '0', suffix: parseStat(s.value).suffix })),
  );

  readonly gallery = [
    { title: 'UN AWARDS: NeST Recognized', date: '23rd Sep, 2026', image: 'https://www.ppra.go.tz/uploads/sliders/slider-1790172328.jpeg' },
    { title: 'PPRA targets three million job opportunities', date: '23rd Aug, 2026', image: 'https://www.ppra.go.tz/uploads/news/5cfa805071507b1cc77f48967a890355.jpeg' },
    { title: 'Kizimkazi: Dr. Samia recognizes PPRA', date: '18th Aug, 2026', image: 'https://www.ppra.go.tz/uploads/news/19bf0d929420275bce4791fd5a635b92.jpeg' },
    { title: 'Performance Report handover', date: '30th Mar, 2026', image: 'https://www.ppra.go.tz/uploads/sliders/slider-1788240040.png' },
  ];

  readonly zonalOffices = [
    { name: 'Lake Zone', city: 'Mwanza', email: 'zm.lake@ppra.go.tz' },
    { name: 'Northern Zone', city: 'Arusha', email: 'zm.northern@ppra.go.tz' },
    { name: 'Southern Highlands Zone', city: 'Mbeya', email: 'zm.highlands@ppra.go.tz' },
    { name: 'Southern Zone', city: 'Mtwara', email: 'zm.southern@ppra.go.tz' },
    { name: 'Central & Western Zone', city: 'Tabora', email: 'zm.western@ppra.go.tz' },
    { name: 'Coastal Zone', city: 'Dar es Salaam', email: 'zm.coast@ppra.go.tz' },
  ];

  readonly relatedLinks: FooterLink[] = [
    { label: 'Tanzania Government Portal', href: '#' },
    { label: 'NeST Carbon Credits Project', href: '#' },
    { label: 'Ministry of Finance and Planning', href: '#' },
    { label: 'Government Procurement Services Agency', href: '#' },
    { label: 'Procurement & Supplies Professionals Board', href: '#' },
    { label: 'Public Procurement Appeal Authority', href: '#' },
    { label: 'PORALG', href: '#' },
    { label: 'Uganda PPDA', href: '#' },
    { label: 'PPRA Kenya', href: '#' },
    { label: 'Ghana PPA', href: '#' },
  ];

  readonly quickLinks: FooterLink[] = [
    { label: 'Annual Procurement Governance Workshop (APGW)', href: '#' },
    { label: 'NeST', href: '#' },
    { label: 'NeST Tenderer Training Video', href: '#' },
    { label: 'Circulars to Procuring Entities', href: '#' },
    { label: 'TSMS', href: '#' },
    { label: 'Staff Mail', href: '#' },
    { label: 'TANePS', href: '#' },
    { label: 'Common Use Items and Services (CUIS)', href: '#' },
    { label: 'Blacklisted Firms (World Bank)', href: '#' },
    { label: 'Disclaimer', href: '#' },
  ];

  private readonly PREVIEW_COUNT = 4;

  visibleNotices() {
    return this.noticesExpanded() ? this.notices : this.notices.slice(0, this.PREVIEW_COUNT);
  }
  visibleZones() {
    return this.zonesExpanded() ? this.zonalOffices : this.zonalOffices.slice(0, this.PREVIEW_COUNT);
  }
  visibleRelated() {
    return this.relatedExpanded() ? this.relatedLinks : this.relatedLinks.slice(0, this.PREVIEW_COUNT);
  }
  visibleQuick() {
    return this.quickExpanded() ? this.quickLinks : this.quickLinks.slice(0, this.PREVIEW_COUNT);
  }

  toggleNotices() { this.noticesExpanded.update(v => !v); }
  toggleZones() { this.zonesExpanded.update(v => !v); }
  toggleRelated() { this.relatedExpanded.update(v => !v); }
  toggleQuick() { this.quickExpanded.update(v => !v); }

  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private autoRotateId?: number;
  private typeTimer?: number;
  private counterRaf = 0;
  private statsStarted = false;
  private statsObserver?: IntersectionObserver;
  private burstCleanup?: () => void;
  private a11yTrigger: HTMLElement | null = null;
  private lastReadElement: HTMLElement | null = null;

  private scrollHandler = () => {
    this.scrolled.set(window.scrollY > 40);
    const nav = this.host.nativeElement.querySelector('.primary-nav') as HTMLElement | null;
    if (nav) this.navStuck.set(nav.getBoundingClientRect().top <= 0.5);
  };
  private keyHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      this.a11yOpen() ? this.closeAccessibility() : this.openAccessibility();
    }
    if (e.key === 'Escape') {
      if (this.a11yOpen()) { this.closeAccessibility(); return; }
      if (this.loginOpen()) this.loginOpen.set(false);
      if (this.registerOpen()) this.registerOpen.set(false);      // ← ADD
    }
    if (e.key === 'Tab' && this.a11yOpen()) this.trapAccessibilityFocus(e);
  };

  readonly today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  currentSlide(): HeroSlide { return this.slides[this.currentIndex()]; }

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('keydown', this.keyHandler);
    this.restorePrefs();
    this.scrollHandler();
    this.startTyping();
    this.autoRotateId = window.setInterval(() => this.nextSlide(), 6000);
  }

  ngAfterViewInit() {
    this.initStatsObserver();
    this.initBurst();
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('keydown', this.keyHandler);
    if (this.autoRotateId) window.clearInterval(this.autoRotateId);
    this.stopTyping();
    if (this.counterRaf) cancelAnimationFrame(this.counterRaf);
    this.statsObserver?.disconnect();
    this.burstCleanup?.();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.removeEventListener('mouseover', this.hoverRead, true);
    document.removeEventListener('focusin', this.focusRead, true);
  }

  nextSlide() {
    this.currentIndex.update(i => (i + 1) % this.slides.length);
    this.startTyping();
  }
  prevSlide() {
    this.currentIndex.update(i => (i - 1 + this.slides.length) % this.slides.length);
    this.startTyping();
  }
  goToSlide(i: number) {
    this.currentIndex.set(i);
    this.startTyping();
  }

  /* ───────── Hero typewriter ───────── */
  private stopTyping() {
    if (this.typeTimer) { window.clearInterval(this.typeTimer); this.typeTimer = undefined; }
  }

  private startTyping() {
    this.stopTyping();
    const s = this.currentSlide();

    if (this.reduceMotion) {
      this.typedTitle.set(s.title);
      this.typedAccent.set(s.titleAccent);
      this.typingPhase.set('done');
      return;
    }

    this.typedTitle.set('');
    this.typedAccent.set('');
    this.typingPhase.set('title');

    let i = 0;
    let j = 0;
    this.typeTimer = window.setInterval(() => {
      if (this.typingPhase() === 'title') {
        i++;
        this.typedTitle.set(s.title.slice(0, i));
        if (i >= s.title.length) this.typingPhase.set('accent');
      } else if (this.typingPhase() === 'accent') {
        j++;
        this.typedAccent.set(s.titleAccent.slice(0, j));
        if (j >= s.titleAccent.length) {
          this.typingPhase.set('done');
          this.stopTyping();
        }
      }
    }, 45);
  }

  /* ───────── Impact numbers count-up ───────── */
  private initStatsObserver() {
    const el = this.impactCard?.nativeElement;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { this.startCounters(); return; }
    this.statsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.startCounters();
        this.statsObserver?.disconnect();
      }
    }, { threshold: 0.3 });
    this.statsObserver.observe(el);
  }

  private startCounters() {
    if (this.statsStarted) return;
    this.statsStarted = true;
    const targets = this.stats.map(s => parseStat(s.value));

    if (this.reduceMotion) {
      this.statDisplay.set(targets.map(t => ({ value: t.num.toLocaleString('en-US'), suffix: t.suffix })));
      return;
    }

    const duration = 1900;
    const t0 = performance.now();
    const tick = (now: number) => {
      let allDone = true;
      this.statDisplay.set(targets.map((t, i) => {
        const p = Math.min(1, Math.max(0, (now - t0 - i * 140) / duration));
        if (p < 1) allDone = false;
        const eased = 1 - Math.pow(1 - p, 3);
        return { value: Math.round(t.num * eased).toLocaleString('en-US'), suffix: t.suffix };
      }));
      if (!allDone) this.counterRaf = requestAnimationFrame(tick);
    };
    this.counterRaf = requestAnimationFrame(tick);
  }

  /* ───────── Radiating-line canvas (CTA section) ───────── */
  private initBurst() {
    const canvas = this.burstCanvas?.nativeElement;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Deterministic pseudo-random so the fan looks the same on every load
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const N = 170;
    const lines = Array.from({ length: N }, (_, i) => {
      const th = Math.PI * (0.03 + 0.94 * (i / (N - 1)));
      const dome = Math.pow(Math.sin(th), 0.7);
      return {
        th,
        base: (0.42 + 0.58 * dome) * (0.72 + 0.28 * rnd()),
        ph: rnd() * Math.PI * 2,
        sp: 0.6 + rnd() * 0.9,
        dot: 1 + rnd() * 1.3,
      };
    });

    let w = 0, h = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let introStart = 0;
    let visible = false;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const dark = this.darkMode();
      const intro = this.reduceMotion ? 1 : (() => {
        const p = Math.min(1, Math.max(0, (t - introStart) / 1800));
        return 1 - Math.pow(1 - p, 3);
      })();

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      const cx = w / 2;
      const cy = h + 6;
      const R = Math.min(w * 0.42, h * 0.5);
      const tilt = (mouse.x - 0.5) * 0.2;
      const mx = mouse.x * w;
      const my = mouse.y * h;

      ctx.lineWidth = 1;
      for (const l of lines) {
        const wave = 1 + 0.05 * Math.sin(t * 0.001 * l.sp + l.ph);
        const r = R * l.base * wave * intro;
        const th = l.th + tilt * (0.4 + 0.6 * Math.sin(l.th)) + 0.012 * Math.sin(t * 0.0007 * l.sp + l.ph);
        const x = cx + Math.cos(th) * r;
        const y = cy - Math.sin(th) * r;

        // Lines close to the pointer glow a little brighter
        const d = Math.hypot(x - mx, y - my);
        const near = Math.max(0, 1 - d / 160);

        // Palette: gold / brown only (matches the rest of the page)
        const a = 0.16 + 0.2 * l.base + near * 0.35;
        ctx.strokeStyle = dark ? `rgba(253,185,19,${a})` : `rgba(139,105,20,${a})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = dark ? `rgba(252,211,77,${0.55 + near * 0.4})` : `rgba(120,53,15,${0.5 + near * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, l.dot + near * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (!visible) { raf = 0; return; }
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = (e.clientY - r.top) / r.height;
    };
    const onLeave = () => { mouse.tx = 0.5; mouse.ty = 0.5; };
    const onResize = () => { resize(); if (this.reduceMotion) draw(performance.now()); };

    resize();

    this.zone.runOutsideAngular(() => {
      host.addEventListener('mousemove', onMove);
      host.addEventListener('mouseleave', onLeave);
      window.addEventListener('resize', onResize);

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (!introStart) introStart = performance.now();
          if (this.reduceMotion) draw(performance.now());
          else if (!raf) raf = requestAnimationFrame(loop);
        }
      }, { threshold: 0.05 });
      io.observe(host);

      this.burstCleanup = () => {
        io.disconnect();
        if (raf) cancelAnimationFrame(raf);
        host.removeEventListener('mousemove', onMove);
        host.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('resize', onResize);
      };
    });
  }

  /* ───────── Modals ───────── */
  openLogin() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.registerOpen.set(false);
    this.loginOpen.set(true);
  }
  closeLogin() { this.loginOpen.set(false); }

  openRegister() {                                 // ← ADD
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loginOpen.set(false);
    this.registerOpen.set(true);
  }
  closeRegister() { this.registerOpen.set(false); }   // ← ADD

  switchToRegister() {                             // ← ADD
    this.loginOpen.set(false);
    this.registerOpen.set(true);
  }
  switchToLogin() {                                // ← ADD
    this.registerOpen.set(false);
    this.loginOpen.set(true);
  }

  openAccessibility() {
    if (this.a11yOpen()) return;
    this.a11yTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.a11yOpen.set(true);
    window.setTimeout(() => this.a11yPanel?.nativeElement.querySelector<HTMLElement>('button:not([disabled])')?.focus(), 0);
  }
  closeAccessibility() {
    if (!this.a11yOpen()) return;
    this.a11yOpen.set(false);
    window.setTimeout(() => this.a11yTrigger?.focus(), 0);
  }

  private trapAccessibilityFocus(e: KeyboardEvent) {
    const panel = this.a11yPanel?.nativeElement;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hidden);
    if (!items.length) { e.preventDefault(); panel.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  }

  scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  toggleDarkMode(): void {
    this.theme.toggle();
  }

  setLanguage(language: AppLanguage): void { this.languageService.setLanguage(language); }

  setTheme(t: 'light' | 'dark'): void {
    this.theme.set(t === 'dark');
  }

  setContrast(c: 'normal' | 'inverted' | 'dark' | 'light') {
    this.contrast.set(c);
    this.persistPrefs();
  }

  setTextSize(s: 'normal' | 's' | 'l' | 'xl' | 'xxl') {
    this.textSize.set(s);
    this.persistPrefs();
  }

  labelForSize(s: string): string {
    const map: Record<string, string> = {
      normal: 'Normal', s: 'S', l: 'L', xl: 'XL', xxl: 'XXL'
    };
    return map[s];
  }

  toggleReadAloud() {
    const next = !this.readAloud();
    this.readAloud.set(next);
    this.persistPrefs();
    if (next) {
      document.addEventListener('mouseover', this.hoverRead, true);
      document.addEventListener('focusin', this.focusRead, true);
    } else {
      document.removeEventListener('mouseover', this.hoverRead, true);
      document.removeEventListener('focusin', this.focusRead, true);
      this.lastReadElement = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }

  private hoverRead = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button');
    if (!el) return;
    this.speakElement(el);
  };

  private focusRead = (e: FocusEvent) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button');
    if (el) this.speakElement(el);
  };

  private speakElement(el: HTMLElement) {
    const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text || !('speechSynthesis' in window) || this.lastReadElement === el) return;
    this.lastReadElement = el;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  resetAccessibility() {
    this.theme.set(false);
    this.contrast.set('normal');
    this.textSize.set('normal');
    this.readAloud.set(false);
    document.removeEventListener('mouseover', this.hoverRead, true);
    document.removeEventListener('focusin', this.focusRead, true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    localStorage.removeItem('ppra.a11y');
  }

  private persistPrefs() {
    try {
      localStorage.setItem('ppra.a11y', JSON.stringify({
        contrast: this.contrast(),
        textSize: this.textSize(),
        readAloud: this.readAloud(),
      }));
    } catch { /* ignore */ }
  }

  private restorePrefs() {
    try {
      const raw = localStorage.getItem('ppra.a11y');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (['normal', 'inverted', 'dark', 'light'].includes(p.contrast)) this.contrast.set(p.contrast);
      if (['normal', 's', 'l', 'xl', 'xxl'].includes(p.textSize)) this.textSize.set(p.textSize);
      if (p.readAloud === true) {
        this.readAloud.set(true);
        document.addEventListener('mouseover', this.hoverRead, true);
        document.addEventListener('focusin', this.focusRead, true);
      }
    } catch { /* ignore */ }
  }
}
