/* eslint-disable guard-for-in */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-underscore-dangle */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Performance } from './performance.model';
import { UserReservation } from './userReservation.model';

interface UserReservationData {
  userId: string;
  performance: Performance;
  numberOfTickets: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserReservationsService {

  private _userReservations = new BehaviorSubject<UserReservation[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) { }

  get userReservations() {
    return this._userReservations.asObservable();
  }

  getReservations() {
    const userId = this.authService.currentUser.id;
    return this.http.
      get<{[key: string]: UserReservationData}>(`https://project-7819b-default-rtdb.europe-west1.firebasedatabase.app/reservations.json`)
      .pipe(map((reservationData) => {
      const userReservations: UserReservation[] = [];

      for(const key in reservationData){

      if(reservationData.hasOwnProperty(key) && reservationData[key].userId === userId){
        userReservations.push({
          id: key,
          userId: reservationData[key].userId,
          performance: reservationData[key].performance,
          numberOfTickets: reservationData[key].numberOfTickets,
        });
      }
    }
    this._userReservations.next(userReservations);
    return userReservations;
  }));
}

  reserveTickets(performance: Performance, numberOfTickets: number){
    let generatedId;
    const userId = this.authService.currentUser.id;
    return this.http.post<{name: string}>(`https://project-7819b-default-rtdb.europe-west1.firebasedatabase.app/reservations.json`,
      {
        userId,
        performance,
        numberOfTickets
      }).pipe(switchMap((resData) => {

        generatedId = resData.name;
        return this.userReservations;

      }), take(1), tap(userReservations => {
        this._userReservations.next(userReservations.concat({
          id: generatedId,
          userId,
          performance,
          numberOfTickets
        }));
      })
    );
  }
}