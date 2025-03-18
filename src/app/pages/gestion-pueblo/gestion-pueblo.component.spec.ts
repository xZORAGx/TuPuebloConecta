import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPuebloComponent } from './gestion-pueblo.component';

describe('GestionPuebloComponent', () => {
  let component: GestionPuebloComponent;
  let fixture: ComponentFixture<GestionPuebloComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPuebloComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPuebloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
